import * as core from "@actions/core";
import * as github from "@actions/github";
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
  CREATE_CDA_TOKEN,
  ACTIONS
} from "./constants";
import {
  delay,
  filenameToVersion,
  getBranchNames,
  getNameFromPattern,
  Logger,
  versionToFilename,
} from "./utils";
import setLocale from "./action/setLocale";
import updateAPIKeys from "./action/updateAPIKeys";
import createCDAToken from "./action/createCDAToken";
import createEnvironment from "./action/createEnvironment";
import applyMigrations from "./action/applyMigrations";
import updateAlias from "./action/updateAlias";
import cleanUpEnvironments from "./action/cleanUpEnvironments";
import type { Environment, Space } from "contentful-management";

/**
 * This is a synchronous implementation of runAction - events happen in order, always.
 * TODO: Consider allowing all actions to be run in any order. Would create a few dependencies,
 * but would also open up more novel workflows. Recommend changing when needed.
 * 
 * @param space
 */
export const runAction = async (space: Space): Promise<void> => {
  const branchNames = getBranchNames();
  const branchName = branchNames.headRef;
  const tokenKeyName = `ephemeral-token-${branchName}`;

  let environment: Environment, backupEnvironment: Environment, environmentType: string, defaultLocale: string;

  if (ACTIONS.includes("createEnvironment"))
    ({ environment, environmentType } = await createEnvironment({ space, branchNames }))
  else {
    environment = await space.getEnvironment(CONTENTFUL_ALIAS);
  }

  if (ACTIONS.includes("backupEnvironment")) {
    // creating, but ignoring the returned environment. It's a backup.
    ({ environment: backupEnvironment } = await createEnvironment({ space, branchNames }))
  }

  if (ACTIONS.includes("createCDAToken")) { // replaces CREATE_CDA_TOKEN env
    await createCDAToken({ space, tokenKeyName, environment })
  }

  // Update API Keys only if we created a new environment. Do for both backup and primary
  if (ACTIONS.includes("createEnvironment")) {
    await updateAPIKeys({ space, tokenKeyName, environment })
  }
  if (backupEnvironment) { // set API keys for backup environment while we're here
    await updateAPIKeys({ space, tokenKeyName, environment: backupEnvironment })
  }

  // always. this doesn't actually set anything
  defaultLocale = await setLocale({ environment })

  if (ACTIONS.includes("applyMigrations")) {
    await applyMigrations({ environment, defaultLocale })
  }

  if (ACTIONS.includes("updateAlias")) { // reaplces SET_ALIAS env
    await updateAlias({ environmentType, space, environment })
  }

  if (ACTIONS.includes("cleanUpEnvironments")) { // replaces DELETE_FEATURE env
    await cleanUpEnvironments({ space, tokenKeyName, branchNames })
  }

  // Set the outputs for further actions
  core.setOutput(
    "environment_url",
    `https://app.contentful.com/spaces/${space.sys.id}/environments/${environment.sys.id}`
  );
  core.setOutput("environment_name", environment.sys.id);
  Logger.success("🚀 All done 🚀");
};
