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
exports.getEnvironment = exports.getBranchNames = exports.getNameFromPattern = exports.matchers = exports.Matcher = exports.branchNameToEnvironmentName = exports.versionToFilename = exports.filenameToVersion = exports.delay = exports.Logger = void 0;
const github = __importStar(require("@actions/github"));
const chalk_1 = __importDefault(require("chalk"));
const constants_1 = require("./constants");
const types_1 = require("./types");
const path_1 = __importDefault(require("path"));
// Force colors on github
chalk_1.default.level = 3;
const stringifyObject = (obj) => JSON.stringify(obj, null, 2);
exports.Logger = {
    log(message) {
        console.log(chalk_1.default.white(message));
    },
    success(message) {
        console.log("✅", chalk_1.default.green(message));
    },
    error(message) {
        console.log("💩", chalk_1.default.red(message));
    },
    warn(message) {
        console.log("⚠️", chalk_1.default.yellow(message));
    },
    info(message) {
        console.log("ℹ️", chalk_1.default.blue(message));
    },
    verbose(message) {
        if (constants_1.LOG_LEVEL === "verbose") {
            console.log(chalk_1.default.white(message));
        }
    },
};
/**
 * Promise based delay
 * @param time
 */
const delay = (time = constants_1.DELAY) => new Promise((resolve) => setTimeout(resolve, time));
exports.delay = delay;
/**
 * Convert fileNames to versions
 * @example
 * filenameToVersion("1.js") // "1"
 * filenameToVersion("1.0.1.js") // "1.0.1"
 */
const filenameToVersion = (file) => {
    exports.Logger.success(`filenameToVersion function`);
    exports.Logger.info(`file: ${file}`);
    return path_1.default.parse(file).name;
};
exports.filenameToVersion = filenameToVersion;
/**
 * Convert versions to filenames
 * @example
 * versionToFilename("1") // "1.js"
 * versionToFilename("1.0.1") // "1.0.1.js"
 */
const versionToFilename = (version, ext) => {
    exports.Logger.success(`versionToFilename function`);
    exports.Logger.info(`version: ${version}`);
    return `${version.replace(/\\./g, "_")}.${ext}`;
};
exports.versionToFilename = versionToFilename;
/**
 * Convert a branchName to a valid environmentName
 * @param branchName
 */
const branchNameToEnvironmentName = (branchName) => {
    exports.Logger.success(`branchNameToEnvironmentName function`);
    exports.Logger.info(`branchName: ${branchName}`);
    try {
        const newBranchName = branchName.replace(/[\/_.]/g, "-");
        return newBranchName;
    }
    catch (e) {
        console.trace('branchNameToEnvironmentName error', e);
        throw new Error(e);
    }
};
exports.branchNameToEnvironmentName = branchNameToEnvironmentName;
var Matcher;
(function (Matcher) {
    Matcher["YY"] = "YY";
    Matcher["YYYY"] = "YYYY";
    Matcher["MM"] = "MM";
    Matcher["DD"] = "DD";
    Matcher["hh"] = "hh";
    Matcher["mm"] = "mm";
    Matcher["ss"] = "ss";
    Matcher["branch"] = "branch";
    Matcher["tag"] = "tag";
})(Matcher || (exports.Matcher = Matcher = {}));
exports.matchers = {
    [Matcher.ss]: (date) => `${date.getUTCSeconds()}`.padStart(2, "0"),
    [Matcher.hh]: (date) => `${date.getUTCHours()}`.padStart(2, "0"),
    [Matcher.mm]: (date) => `${date.getUTCMinutes()}`.padStart(2, "0"),
    [Matcher.YYYY]: (date) => `${date.getUTCFullYear()}`,
    [Matcher.YY]: (date) => `${date.getUTCFullYear()}`.substr(2, 2),
    [Matcher.MM]: (date) => `${date.getUTCMonth() + 1}`.padStart(2, "0"),
    [Matcher.DD]: (date) => `${date.getDate()}`.padStart(2, "0"),
    [Matcher.branch]: (branchName) => {
        exports.Logger.success('matchers[Matcher.branch]');
        exports.Logger.info(`Matcher.branch ${Matcher.branch}`);
        exports.Logger.info(`branchName: ${branchName}`);
        return (0, exports.branchNameToEnvironmentName)(branchName);
    },
    [Matcher.tag]: (tag) => {
        exports.Logger.success('matchers[Matcher.tag]');
        exports.Logger.info(`Matcher.tag ${Matcher.tag}`);
        exports.Logger.info(`tag: ${tag}`);
        return (0, exports.branchNameToEnvironmentName)(tag);
    }
};
/**
 *
 * @param pattern
 * @param branchName
 */
const getNameFromPattern = (pattern, { branchName } = {}) => {
    exports.Logger.success(`getNameFromPattern function`);
    exports.Logger.info(`pattern: ${pattern}`);
    exports.Logger.info(`branchName: ${branchName}`);
    const date = new Date();
    return pattern.replace(/\[(YYYY|YY|MM|DD|hh|mm|ss|branch|tag)]/g, (substring, match) => {
        switch (match) {
            case Matcher.branch:
                return exports.matchers[Matcher.branch](branchName);
            case Matcher.tag:
                return exports.matchers[Matcher.tag](process.env.GITHUB_REF_NAME);
            case Matcher.YYYY:
            case Matcher.YY:
            case Matcher.MM:
            case Matcher.DD:
            case Matcher.hh:
            case Matcher.mm:
            case Matcher.ss:
                return exports.matchers[match](date);
            default:
                return substring;
        }
    });
};
exports.getNameFromPattern = getNameFromPattern;
/**
 * Get the branchNames based on the eventName
 */
const getBranchNames = () => {
    const { eventName, payload } = github.context;
    const { default_branch: defaultBranch } = payload.repository;
    // Check the eventName
    exports.Logger.success('getBranchNames function');
    exports.Logger.info(`eventName: ${eventName}`);
    exports.Logger.info(`payload: ${stringifyObject(payload)}`);
    switch (eventName) {
        // If pullRequest we need to get the head and base
        case types_1.EventNames.pullRequest:
            return {
                baseRef: payload.pull_request.base.ref,
                headRef: payload.pull_request.head.ref,
                defaultBranch,
            };
        // If not pullRequest we need work on the baseRef therefore head is null
        default:
            return {
                headRef: null,
                baseRef: payload.ref.replace(/^refs\/heads\//, ""),
                defaultBranch,
            };
    }
};
exports.getBranchNames = getBranchNames;
/**
 * Get the environment from a space
 * Checks if an environment already exists and then flushes it
 * @param space
 * @param branchNames
 */
const getEnvironment = async (space, branchNames) => {
    exports.Logger.success('getEnvironment function');
    exports.Logger.info(`space ${stringifyObject(space)}`);
    exports.Logger.info(`branchNames ${stringifyObject(branchNames)}`);
    const environmentNames = {
        base: (0, exports.branchNameToEnvironmentName)(branchNames.baseRef),
        head: branchNames.headRef
            ? (0, exports.branchNameToEnvironmentName)(branchNames.headRef)
            : null,
    };
    // If the Pull Request is merged and the base is the repository default_name (master|main, ...)
    // Then create an environment name for the given master_pattern
    // Else create an environment name for the given feature_pattern
    exports.Logger.info(`MASTER_PATTERN: ${constants_1.MASTER_PATTERN} | FEATURE_PATTERN: ${constants_1.FEATURE_PATTERN}`);
    const defaultBranch = constants_1.DEFAULT_BRANCH_NAME || branchNames.defaultBranch;
    exports.Logger.info(`branchNames.baseRef: ${branchNames.baseRef}`);
    exports.Logger.info(`defaultBranch: ${defaultBranch}`);
    exports.Logger.info(`github.context.payload: ${stringifyObject(github.context.payload)}`);
    // github.context.payload.pull_request?.merged... however for testing we're pushing directly to main...
    const environmentType = branchNames.baseRef === defaultBranch &&
        github.context.payload.pull_request?.merged
        ? constants_1.CONTENTFUL_ALIAS
        : "feature";
    exports.Logger.info(`environmentType: ${environmentType}`);
    exports.Logger.info(`CONTENTFUL_ALIAS: ${constants_1.CONTENTFUL_ALIAS}`);
    const isEnvTypeAlias = environmentType === constants_1.CONTENTFUL_ALIAS;
    exports.Logger.info(`isEnvTypeAlias: ${isEnvTypeAlias}`);
    exports.Logger.info(`MASTER_PATTERN: ${constants_1.MASTER_PATTERN}`);
    exports.Logger.info(`FEATURE_PATTERN: ${constants_1.FEATURE_PATTERN}`);
    exports.Logger.info(`branchNames.headRef: ${branchNames.headRef}`);
    const environmentId = environmentType === constants_1.CONTENTFUL_ALIAS
        ? (0, exports.getNameFromPattern)(constants_1.MASTER_PATTERN)
        : (0, exports.getNameFromPattern)(constants_1.FEATURE_PATTERN, {
            branchName: branchNames.headRef,
        });
    exports.Logger.info(`environmentId: "${environmentId}"`);
    // If environment matches ${CONTENTFUL_ALIAS} ("master")
    // Then return it without further actions
    if (environmentType === constants_1.CONTENTFUL_ALIAS) {
        return {
            environmentType,
            environmentNames,
            environmentId,
            environment: await space.createEnvironmentWithId(environmentId, {
                name: environmentId,
            }),
        };
    }
    // Else we need to check for an existing environment and flush it
    exports.Logger.log(`Checking for existing versions of environment: "${environmentId}"`);
    try {
        const environment = await space.getEnvironment(environmentId);
        await environment?.delete();
        exports.Logger.success(`Environment deleted: "${environmentId}"`);
    }
    catch (e) {
        exports.Logger.log(`Environment not found: "${environmentId}"`);
    }
    exports.Logger.log(`Creating environment ${environmentId}`);
    return {
        environmentType,
        environmentNames,
        environmentId,
        environment: await space.createEnvironmentWithId(environmentId, {
            name: environmentId,
        }),
    };
};
exports.getEnvironment = getEnvironment;
//# sourceMappingURL=utils.js.map