"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAction = exports.readdirAsync = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const contentful_migration_1 = require("contentful-migration");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const to_semver_1 = __importDefault(require("to-semver"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
exports.readdirAsync = (0, util_1.promisify)(fs_1.readdir);
/**
 *
 * @param space
 */
const runAction = async (space) => {
    const branchNames = (0, utils_1.getBranchNames)();
    const { environmentId, environment, environmentType } = await (0, utils_1.getEnvironment)(space, branchNames);
    // Counter to limit retries
    let count = 0;
    utils_1.Logger.log("Waiting for environment processing...");
    while (count < constants_1.MAX_NUMBER_OF_TRIES) {
        const status = (await space.getEnvironment(environment.sys.id)).sys.status
            .sys.id;
        if (status === "ready") {
            utils_1.Logger.success(`Successfully processed new environment: "${environmentId}"`);
            break;
        }
        if (status === "failed") {
            utils_1.Logger.warn("Environment creation failed");
            break;
        }
        await (0, utils_1.delay)();
        count++;
    }
    if (count >= constants_1.MAX_NUMBER_OF_TRIES) {
        utils_1.Logger.warn("Environment never returned ready. Try increasing your delay or tries.");
        utils_1.Logger.warn("Continuing action, but expect a failure.");
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
    if (constants_1.CREATE_CDA_TOKEN) {
        const spaceKeys = await space.getApiKeys();
        const exists = spaceKeys.items.some(item => item.name === tokenKeyName);
        if (exists) {
            utils_1.Logger.log(`CDA token ${tokenKeyName} is already created`);
        }
        else {
            utils_1.Logger.log(`Creating new CDA token "${tokenKeyName}" for ephemeral environment "${environmentId}"...`);
            try {
                await space.createApiKey({
                    name: tokenKeyName,
                    environments: [newEnv],
                });
                utils_1.Logger.success("CDA token has been created");
            }
            catch (err) {
                utils_1.Logger.warn("unable to create ephemeral token");
                utils_1.Logger.verbose(err);
            }
        }
    }
    utils_1.Logger.verbose("Update API Keys to allow access to new environment");
    const { items: keys } = await space.getApiKeys();
    await Promise.all(keys.map((key) => {
        // put token value on every action run
        // helpful in case the first run failed and the "Write Comment" step was not reached
        if (key.name === tokenKeyName) {
            utils_1.Logger.verbose("debug: setting ephemeral token value to ouputs");
            core.setOutput("cda_token", key.accessToken);
            core.setSecret(key.accessToken); // set token as a secret after you've put it in the output!
        }
        utils_1.Logger.verbose(`Updating key named "${key.name}" with ID:"${key.sys.id}"`);
        key.environments.push(newEnv);
        return key.update();
    }));
    utils_1.Logger.verbose("Set default locale to new environment");
    const defaultLocale = (await environment.getLocales()).items.find((locale) => locale.default).code;
    utils_1.Logger.verbose("Read all the available migrations from the file system");
    const migrationsFiles = await (0, exports.readdirAsync)(constants_1.MIGRATIONS_DIR);
    // Check for available migrations
    // Migration scripts need to be sorted in order to run without conflicts
    const availableMigrations = (0, to_semver_1.default)(migrationsFiles.map((file) => (0, utils_1.filenameToVersion)(file)), { clean: false }).reverse();
    utils_1.Logger.verbose(`versionOrder: ${JSON.stringify(availableMigrations, null, 4)}`);
    utils_1.Logger.verbose("Find current version of the contentful space");
    const { items: versions } = await environment.getEntries({
        content_type: constants_1.VERSION_CONTENT_TYPE,
    });
    // If there is no entry or more than one of CONTENTFUL_VERSION_TRACKING
    // Then throw an Error and abort
    if (versions.length === 0) {
        throw new Error(`There should be exactly one entry of type "${constants_1.VERSION_CONTENT_TYPE}"`);
    }
    if (versions.length > 1) {
        throw new Error(`There should only be one entry of type "${constants_1.VERSION_CONTENT_TYPE}"`);
    }
    const [storedVersionEntry] = versions;
    const currentVersionString = storedVersionEntry.fields[constants_1.VERSION_FIELD][defaultLocale];
    utils_1.Logger.verbose("Evaluate which migrations to run");
    const currentMigrationIndex = availableMigrations.indexOf(currentVersionString);
    // If the migration can't be found
    // Then abort
    if (currentMigrationIndex === -1) {
        throw new Error(`Version ${currentVersionString} is not matching with any known migration`);
    }
    const migrationsToRun = availableMigrations.slice(currentMigrationIndex + 1);
    const migrationOptions = {
        spaceId: constants_1.SPACE_ID,
        environmentId,
        accessToken: constants_1.MANAGEMENT_API_KEY,
        yes: true,
    };
    utils_1.Logger.verbose("Run migrations and update version entry");
    // Allow mutations
    let migrationToRun;
    let mutableStoredVersionEntry = storedVersionEntry;
    while ((migrationToRun = migrationsToRun.shift())) {
        const filePath = path_1.default.join(constants_1.MIGRATIONS_DIR, migrationsFiles.find((file) => (0, utils_1.filenameToVersion)(file) === migrationToRun).replace(".ts", ".js"));
        utils_1.Logger.verbose(`Running ${filePath}`);
        await (0, contentful_migration_1.runMigration)(Object.assign(migrationOptions, {
            filePath,
        }));
        utils_1.Logger.success(`Migration script ${migrationToRun}.js succeeded`);
        mutableStoredVersionEntry.fields.version[defaultLocale] = migrationToRun;
        mutableStoredVersionEntry = await mutableStoredVersionEntry.update();
        mutableStoredVersionEntry = await mutableStoredVersionEntry.publish();
        utils_1.Logger.success(`Updated field ${constants_1.VERSION_FIELD} in ${constants_1.VERSION_CONTENT_TYPE} entry to ${migrationToRun}`);
    }
    utils_1.Logger.log(`Checking if we need to update ${constants_1.CONTENTFUL_ALIAS} alias`);
    // If the environmentType is ${CONTENTFUL_ALIAS} ("master")
    // Then set the alias to the new environment
    // Else inform the user
    if (environmentType === constants_1.CONTENTFUL_ALIAS && constants_1.SET_ALIAS) {
        utils_1.Logger.log(`Running on ${constants_1.CONTENTFUL_ALIAS}.`);
        utils_1.Logger.log(`Updating ${constants_1.CONTENTFUL_ALIAS} alias.`);
        await space
            .getEnvironmentAlias(constants_1.CONTENTFUL_ALIAS)
            .then((alias) => {
            alias.environment.sys.id = environmentId;
            return alias.update();
        })
            .then((alias) => utils_1.Logger.success(`alias ${alias.sys.id} updated.`))
            .catch(utils_1.Logger.error);
    }
    else {
        utils_1.Logger.verbose("Running on feature branch");
        utils_1.Logger.verbose("No alias changes required");
    }
    // "closed" action happens on PR close and PR merge
    const githubAction = github.context.payload.action;
    // If CDA token is created and we want to purge ephemeral env upon close/merge
    // then ephemeral token should be deleted as well
    if (constants_1.DELETE_FEATURE &&
        constants_1.CREATE_CDA_TOKEN &&
        githubAction === "closed") {
        utils_1.Logger.verbose(`debug: attempting to delete ${tokenKeyName}`);
        const { items: keys } = await space.getApiKeys();
        const k = keys.find(key => key.name === tokenKeyName);
        if (k === undefined) {
            utils_1.Logger.warn(`could not find ephemeral token ${tokenKeyName}, possibly it was deleted manually`);
        }
        else {
            try {
                await k.delete();
                utils_1.Logger.success(`removed ephemeral token ${tokenKeyName}`);
            }
            catch (error) {
                utils_1.Logger.error("Unable to delete ephemeral token");
                utils_1.Logger.verbose(error);
            }
        }
    }
    // If the sandbox environment should be deleted
    // And the baseRef is the repository default_branch (master|main ...)
    // And the Pull Request has been merged
    // Then delete the sandbox environment
    if (constants_1.DELETE_FEATURE &&
        githubAction === "closed") {
        try {
            const environmentIdToDelete = (0, utils_1.getNameFromPattern)(constants_1.FEATURE_PATTERN, {
                branchName: branchNames.headRef,
            });
            utils_1.Logger.log(`Delete the environment: ${environmentIdToDelete}`);
            const environment = await space.getEnvironment(environmentIdToDelete);
            await environment?.delete();
            utils_1.Logger.success(`Deleted the environment: ${environmentIdToDelete}`);
        }
        catch (error) {
            utils_1.Logger.error("Cannot delete the environment");
        }
    }
    // Set the outputs for further actions
    core.setOutput("environment_url", `https://app.contentful.com/spaces/${space.sys.id}/environments/${environmentId}`);
    core.setOutput("environment_name", environmentId);
    utils_1.Logger.success("🚀 All done 🚀");
};
exports.runAction = runAction;
//# sourceMappingURL=action.js.map