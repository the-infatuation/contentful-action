import * as github from '@actions/github';
import chalk from 'chalk';
import { type Space } from 'contentful-management/dist/typings/entities/space';
import {
  CONTENTFUL_ALIAS,
  DEFAULT_BRANCH_NAME,
  DELAY,
  FEATURE_PATTERN,
  GITHUB_REF_NAME,
  LOG_LEVEL,
  MASTER_PATTERN,
  SOURCE_ENVIRONMENT_ID,
} from './constants';
import { type BranchNames, type EnvironmentProps, type NameFromPatternArgs } from './types';

// Force colors on github
chalk.level = 3;

const stringifyObject = (object) => JSON.stringify(object, null, 2);

const sanitizeMsg = (message: string): string => message.replace(/\n|\r/g, '');

/* eslint-disable no-console */
export const Logger = {
  log(message) {
    if (typeof message === 'string') {
      console.log(sanitizeMsg(message));
    } else {
      console.log(message);
    }
  },
  info(message) {
    if (typeof message === 'string') {
      console.info(sanitizeMsg(message));
    } else {
      console.info(message);
    }
  },
  success(message) {
    if (typeof message === 'string') {
      console.info(sanitizeMsg(message));
    } else {
      console.info(message);
    }
  },
  warn(message) {
    if (typeof message === 'string') {
      console.warn(sanitizeMsg(message));
    } else {
      console.warn(message);
    }
  },
  error(message) {
    if (typeof message === 'string') {
      console.error(sanitizeMsg(message));
    } else {
      console.error(message);
    }
  },
  verbose(message) {
    if (LOG_LEVEL === 'verbose') {
      if (typeof message === 'string') {
        console.debug(sanitizeMsg(message));
      } else {
        console.debug(message);
      }
    }
  },
};
/* eslint-enable no-console */

/**
 * Promise based delay
 * @param time
 */
export const delay = async (time = DELAY): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

/**
 * Convert fileNames to versions
 * @example
 * filenameToVersion("1.js") // "1"
 * filenameToVersion("1.0.1.js") // "1.0.1"
 */
export const filenameToVersion = (file: string): string => {
  Logger.success('filenameToVersion function');
  Logger.info(`file: ${file}`);

  return file.replace(/\.js$/, '').replaceAll('_', '.');
};

/**
 * Convert versions to filenames
 * @example
 * versionToFilename("1") // "1.js"
 * versionToFilename("1.0.1") // "1.0.1.js"
 */
export const versionToFilename = (version: string): string => {
  Logger.success('versionToFilename function');
  Logger.info(`version: ${version}`);

  return `${version.replaceAll(/\\./g, '_')}.js`;
};

/**
 * Convert a branchName to a valid environmentName
 * @param branchName
 */
export const branchNameToEnvironmentName = (branchName: string): string => {
  Logger.success('branchNameToEnvironmentName function');
  Logger.info(`branchName: ${branchName}`);
  try {
    const newBranchName = branchName.replaceAll(/[/_.]/g, '-');

    return newBranchName;
  } catch (error) {
    Logger.error('branchNameToEnvironmentName error:');
    throw new Error(error);
  }
};

export enum Matcher {
  YY = 'YY',
  YYYY = 'YYYY',
  MM = 'MM',
  DD = 'DD',
  hh = 'hh',
  mm = 'mm',
  ss = 'ss',
  branch = 'branch',
  tag = 'tag',
}

export const matchers = {
  [Matcher.ss]: (date: Date): string => `${date.getUTCSeconds()}`.padStart(2, '0'),
  [Matcher.hh]: (date: Date): string => `${date.getUTCHours()}`.padStart(2, '0'),
  [Matcher.mm]: (date: Date): string => `${date.getUTCMinutes()}`.padStart(2, '0'),
  [Matcher.YYYY]: (date: Date): string => `${date.getUTCFullYear()}`,
  [Matcher.YY]: (date: Date): string => `${date.getUTCFullYear()}`.slice(2, 4),
  [Matcher.MM]: (date: Date): string => `${date.getUTCMonth() + 1}`.padStart(2, '0'),
  [Matcher.DD]: (date: Date): string => `${date.getDate()}`.padStart(2, '0'),
  [Matcher.branch](branchName: string): string {
    Logger.success('matchers[Matcher.branch]');
    Logger.info(`Matcher.branch ${Matcher.branch}`);
    Logger.info(`branchName: ${branchName}`);

    return branchNameToEnvironmentName(branchName);
  },
  [Matcher.tag](tag: string): string {
    Logger.success('matchers[Matcher.tag]');
    Logger.info(`Matcher.tag ${Matcher.tag}`);
    Logger.info(`tag: ${tag}`);

    return branchNameToEnvironmentName(tag);
  },
};

const defualtBranchArg = { branchName: null };
/**
 *
 * @param pattern
 * @param branchName
 */
export const getNameFromPattern = (pattern: string, { branchName }: NameFromPatternArgs = defualtBranchArg): string => {
  Logger.success('getNameFromPattern function');
  Logger.info(`pattern: ${pattern}`);
  Logger.info(`branchName: ${branchName}`);
  const date = new Date();

  return pattern.replaceAll(/\[(YYYY|YY|MM|DD|hh|mm|ss|branch|tag)]/g, (substring, match: Matcher) => {
    switch (match) {
      case Matcher.branch:
        if (typeof branchName !== 'string') {
          throw new TypeError('Error: Received no branch name for pattern replacement.');
        }

        return matchers[Matcher.branch](branchName);

      case Matcher.tag:
        if (!GITHUB_REF_NAME) {
          throw new Error('Error: no process env GITHUB_REF_NAME for pattern replacement.');
        }

        return matchers[Matcher.tag](GITHUB_REF_NAME);

      case Matcher.YYYY:
      case Matcher.YY:
      case Matcher.MM:
      case Matcher.DD:
      case Matcher.hh:
      case Matcher.mm:
      case Matcher.ss:
        return matchers[match](date);

      default:
        return substring;
    }
  });
};

/**
 * Get the branchNames based on the eventName
 */
export const getBranchNames = (): BranchNames => {
  const { eventName, payload } = github.context;
  const defaultBranch = payload.repository?.default_branch ?? 'main';

  // Check the eventName
  Logger.success('getBranchNames function');
  Logger.info(`eventName: ${eventName}`);
  Logger.info(`payload: ${stringifyObject(payload)}`);

  switch (eventName) {
    case 'pull_request':
      return {
        baseRef: payload.pull_request?.base.ref as string,
        headRef: payload.pull_request?.head.ref as string,
        defaultBranch,
      };

    // If not pullRequest we need work on the baseRef therefore head is null
    default:
      return {
        headRef: null,
        baseRef: (payload.ref as string)?.replace(/^refs\/heads\//, ''),
        defaultBranch,
      };
  }
};

/**
 * Get the environment from a space
 * Checks if an environment already exists and then flushes it
 * @param space
 * @param branchNames
 */
export const getEnvironment = async (space: Space, branchNames: BranchNames): Promise<EnvironmentProps> => {
  Logger.success('getEnvironment function');
  Logger.info(`space ${stringifyObject(space)}`);
  Logger.info(`branchNames ${stringifyObject(branchNames)}`);
  const environmentNames = {
    base: branchNameToEnvironmentName(branchNames.baseRef),
    head: branchNames.headRef ? branchNameToEnvironmentName(branchNames.headRef) : null,
  };
  // If the Pull Request is merged and the base is the repository default_name (master|main, ...)
  // Then create an environment name for the given master_pattern
  // Else create an environment name for the given feature_pattern
  Logger.info(`MASTER_PATTERN: ${MASTER_PATTERN} | FEATURE_PATTERN: ${FEATURE_PATTERN}`);

  const defaultBranch = DEFAULT_BRANCH_NAME ?? branchNames.defaultBranch;

  Logger.info(`branchNames.baseRef: ${branchNames.baseRef}`);
  Logger.info(`defaultBranch: ${defaultBranch}`);
  Logger.info(`github.context.payload: ${stringifyObject(github.context.payload)}`);
  // Github.context.payload.pull_request?.merged... however for testing we're pushing directly to main...
  const environmentType =
    branchNames.baseRef === defaultBranch && github.context.payload.pull_request?.merged ? CONTENTFUL_ALIAS : 'feature';
  Logger.info(`environmentType: ${environmentType}`);
  Logger.info(`CONTENTFUL_ALIAS: ${CONTENTFUL_ALIAS}`);
  // Const isEnvTypeAlias = environmentType === CONTENTFUL_ALIAS
  // Logger.info(`isEnvTypeAlias: ${isEnvTypeAlias}`);
  Logger.info(`MASTER_PATTERN: ${MASTER_PATTERN}`);
  Logger.info(`FEATURE_PATTERN: ${FEATURE_PATTERN}`);
  Logger.info(`branchNames.headRef: ${branchNames.headRef}`);
  const environmentId =
    environmentType === CONTENTFUL_ALIAS
      ? getNameFromPattern(MASTER_PATTERN)
      : getNameFromPattern(FEATURE_PATTERN, {
          branchName: branchNames.headRef,
        });
  Logger.info(`environmentId: "${environmentId}"`);

  // If environment matches ${CONTENTFUL_ALIAS} ("master")
  // Then return it without further actions
  if (environmentType === CONTENTFUL_ALIAS) {
    return {
      environmentType,
      environmentNames,
      environmentId,
      environment: await space.createEnvironmentWithId(
        environmentId,
        {
          name: environmentId,
        },
        SOURCE_ENVIRONMENT_ID,
      ),
    };
  }

  // Else we need to check for an existing environment and flush it
  Logger.log(`Checking for existing versions of environment: "${environmentId}"`);

  try {
    const environment = await space.getEnvironment(environmentId);
    await environment?.delete();
    Logger.success(`Environment deleted: "${environmentId}"`);
  } catch {
    Logger.log(`Environment not found: "${environmentId}"`);
  }

  Logger.log(`Creating environment ${environmentId}`);

  return {
    environmentType,
    environmentNames,
    environmentId,
    environment: await space.createEnvironmentWithId(environmentId, {
      name: environmentId,
    }),
  };
};
