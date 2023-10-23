import * as core from "@actions/core";
import * as github from "@actions/github";
import { runMigration } from "contentful-migration/built/bin/cli";
import { readdir } from "fs";
import path from "path";
import { promisify } from "util";
import toSemver from 'to-semver'

import {
  CONTENTFUL_ALIAS,
  DELETE_FEATURE,
  SET_ALIAS,
  MANAGEMENT_API_KEY,
  MAX_NUMBER_OF_TRIES,
  MIGRATIONS_DIR,
  SPACE_ID,
  VERSION_CONTENT_TYPE,
  VERSION_FIELD,
  FEATURE_PATTERN,
  CREATE_CDA_TOKEN
} from "./constants";
import {
  delay,
  filenameToVersion,
  getBranchNames,
  getEnvironment,
  getNameFromPattern,
  Logger,
  versionToFilename,
} from "./utils";

export const readdirAsync = promisify(readdir);

/**
 *
 * @param space
 */
export const runAction = async (space): Promise<void> => {
  const branchNames = getBranchNames();
  const { environmentId, environment, environmentType } = await getEnvironment(
    space,
    branchNames
  );

  // Counter to limit retries
  let count = 0;
  Logger.log("Waiting for environment processing...");
  while (count < MAX_NUMBER_OF_TRIES) {
    const status = (await space.getEnvironment(environment.sys.id)).sys.status
      .sys.id;

    if (status === "ready") {
      Logger.success(
        `Successfully processed new environment: "${environmentId}"`
      );
      break;
    }

    if (status === "failed") {
      Logger.warn("Environment creation failed");
      break;
    }

    await delay();
    count++;
  }

  if (count >= MAX_NUMBER_OF_TRIES) {
    Logger.warn("Environment never returned ready. Try increasing your delay or tries.")
    Logger.warn("Continuing action, but expect a failure.")
  }

  const newEnv = {
    sys: {
      type: "Link",
      linkType: "Environment",
      id: environmentId,
    },
  };

  const branchName = branchNames.headRef;
  const tokenKeyName = `ephemeral-token-${branchName}`;

  if (CREATE_CDA_TOKEN) {
    const spaceKeys = await space.getApiKeys();

    const exists = spaceKeys.items.some(item => item.name === tokenKeyName)

    if (exists) {
      Logger.log(`CDA token ${tokenKeyName} is already created`);
    } else {
      Logger.log(`Creating new CDA token "${tokenKeyName}" for ephemeral environment "${environmentId}"...`);

      try {
        const key = await space.createApiKey({
          name: tokenKeyName,
          environments: [newEnv],
        })

        Logger.success("CDA token has been created");
      } catch(err) {
        Logger.warn("unable to create ephemeral token");
        Logger.verbose(err)
      }
    }
  }

  Logger.verbose("Update API Keys to allow access to new environment");

  const { items: keys } = await space.getApiKeys();
  await Promise.all(
    keys.map((key) => {
      // put token value on every action run
      // helpful in case the first run failed and the "Write Comment" step was not reached
      if (key.name == tokenKeyName) {
        Logger.verbose("debug: setting ephemeral token value to ouputs");
        core.setOutput("cda_token", key.accessToken);
        core.setSecret(key.accessToken) // set token as a secret after you've put it in the output!
      }

      Logger.verbose(`Updating key named "${key.name}" with ID:"${key.sys.id}"`);
      key.environments.push(newEnv);
      return key.update();
    })
  );

  Logger.verbose("Set default locale to new environment");
  const defaultLocale = (await environment.getLocales()).items.find(
    (locale) => locale.default
  ).code;

  Logger.verbose("Read all the available migrations from the file system");
  // Check for available migrations
  // Migration scripts need to be sorted in order to run without conflicts
  const availableMigrations = toSemver(
    (await readdirAsync(MIGRATIONS_DIR)).map((file) => filenameToVersion(file)), { clean: false }
  ).reverse();

  Logger.verbose(
    `versionOrder: ${JSON.stringify(availableMigrations, null, 4)}`
  );

  Logger.verbose("Find current version of the contentful space");
  const { items: versions } = await environment.getEntries({
    content_type: VERSION_CONTENT_TYPE,
  });

  // If there is no entry or more than one of CONTENTFUL_VERSION_TRACKING
  // Then throw an Error and abort
  if (versions.length === 0) {
    throw new Error(
      `There should be exactly one entry of type "${VERSION_CONTENT_TYPE}"`
    );
  }

  if (versions.length > 1) {
    throw new Error(
      `There should only be one entry of type "${VERSION_CONTENT_TYPE}"`
    );
  }

  const [storedVersionEntry] = versions;
  const currentVersionString =
    storedVersionEntry.fields[VERSION_FIELD][defaultLocale];

  Logger.verbose("Evaluate which migrations to run");
  const currentMigrationIndex = availableMigrations.indexOf(
    currentVersionString
  );

  // If the migration can't be found
  // Then abort
  if (currentMigrationIndex === -1) {
    throw new Error(
      `Version ${currentVersionString} is not matching with any known migration`
    );
  }

  const migrationsToRun = availableMigrations.slice(currentMigrationIndex + 1);
  const migrationOptions = {
    spaceId: SPACE_ID,
    environmentId,
    accessToken: MANAGEMENT_API_KEY,
    yes: true,
  };

  Logger.verbose("Run migrations and update version entry");
  // Allow mutations
  let migrationToRun;
  let mutableStoredVersionEntry = storedVersionEntry;
  while ((migrationToRun = migrationsToRun.shift())) {
    const filePath = path.join(
      MIGRATIONS_DIR,
      versionToFilename(migrationToRun)
    );
    Logger.verbose(`Running ${filePath}`);
    await runMigration(
      Object.assign(migrationOptions, {
        filePath,
      })
    );
    Logger.success(`Migration script ${migrationToRun}.js succeeded`);

    mutableStoredVersionEntry.fields.version[defaultLocale] = migrationToRun;
    mutableStoredVersionEntry = await mutableStoredVersionEntry.update();
    mutableStoredVersionEntry = await mutableStoredVersionEntry.publish();

    Logger.success(
      `Updated field ${VERSION_FIELD} in ${VERSION_CONTENT_TYPE} entry to ${migrationToRun}`
    );
  }

  Logger.log(`Checking if we need to update ${CONTENTFUL_ALIAS} alias`);
  // If the environmentType is ${CONTENTFUL_ALIAS} ("master")
  // Then set the alias to the new environment
  // Else inform the user

  if (environmentType === CONTENTFUL_ALIAS && SET_ALIAS) {
    Logger.log(`Running on ${CONTENTFUL_ALIAS}.`);
    Logger.log(`Updating ${CONTENTFUL_ALIAS} alias.`);
    await space
      .getEnvironmentAlias(CONTENTFUL_ALIAS)
      .then((alias) => {
        alias.environment.sys.id = environmentId;
        return alias.update();
      })
      .then((alias) => Logger.success(`alias ${alias.sys.id} updated.`))
      .catch(Logger.error);
  } else {
    Logger.verbose("Running on feature branch");
    Logger.verbose("No alias changes required");
  }

  if (
    DELETE_FEATURE &&
    CREATE_CDA_TOKEN &&
    (
      github.context.payload.pull_request?.merged ||
      github.context.payload.pull_request?.closed
    )
  ) {
    const { items: keys } = await space.getApiKeys();
    keys.map((key) => {
      if (key.name == tokenKeyName) {
        try {
          key.delete()
          Logger.success(`removed ephemeral token ${tokenKeyName}`)
        } catch(error) {
          Logger.error("Unable to delete ephemeral token");
          Logger.error(error);
        };
      };
    })
  };

  // If the sandbox environment should be deleted
  // And the baseRef is the repository default_branch (master|main ...)
  // And the Pull Request has been merged
  // Then delete the sandbox environment
  if (
    DELETE_FEATURE &&
    branchNames.baseRef === branchNames.defaultBranch &&
    github.context.payload.pull_request?.merged
  ) {
    try {
      const environmentIdToDelete = getNameFromPattern(FEATURE_PATTERN, {
        branchName: branchNames.headRef,
      });
      Logger.log(`Delete the environment: ${environmentIdToDelete}`);
      const environment = await space.getEnvironment(environmentIdToDelete);
      await environment?.delete();
      Logger.success(`Deleted the environment: ${environmentIdToDelete}`);
    } catch (error) {
      Logger.error("Cannot delete the environment");
    }
  }


  // Set the outputs for further actions
  core.setOutput(
    "environment_url",
    `https://app.contentful.com/spaces/${space.sys.id}/environments/${environmentId}`
  );
  core.setOutput("environment_name", environmentId);
  Logger.success("🚀 All done 🚀");
};
