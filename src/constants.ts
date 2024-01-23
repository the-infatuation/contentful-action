import path from 'node:path';
import process from 'node:process';

export const {
  GITHUB_WORKSPACE,
  GITHUB_REF_NAME,
  LOG_LEVEL,
  INPUT_SPACE_ID: SPACE_ID,
  INPUT_MANAGEMENT_API_KEY: MANAGEMENT_API_KEY,
  INPUT_MIGRATIONS_DIR,
  INPUT_DELETE_FEATURE,
  INPUT_SET_ALIAS,
  INPUT_FEATURE_PATTERN,
  INPUT_MASTER_PATTERN,
  INPUT_VERSION_CONTENT_TYPE,
  INPUT_VERSION_FIELD,
  INPUT_CONTENTFUL_ALIAS,
  INPUT_DELAY,
  INPUT_MAX_NUMBER_OF_TRIES,
  INPUT_CREATE_CDA_TOKEN,
  INPUT_DEFAULT_BRANCH_NAME,
  INPUT_ACTIONS,
} = process.env;

const booleanOr = (string_: string | undefined, fallback: boolean): boolean => {
  switch (string_?.toLowerCase()) {
    case 'true':
      return true;

    case 'false':
      return false;

    default:
      return fallback;
  }
};

export const DEFAULT_MIGRATIONS_DIR = 'migrations';
export const DEFAULT_MASTER_PATTERN = 'master-[YYYY]-[MM]-[DD]-[mm][ss]';
export const DEFAULT_FEATURE_PATTERN = 'GH-[branch]';
export const DEFAULT_VERSION_CONTENT_TYPE = 'versionTracking';
export const DEFAULT_VERSION_FIELD = 'version';
export const DEFAULT_DELETE_FEATURE = false;
export const DEFAULT_SET_ALIAS = false;
export const DEFAULT_CONTENTFUL_ALIAS = 'master';
export const DEFAULT_DELAY = 3000;
export const DEFAULT_MAX_NUMBER_OF_TRIES = 10;
export const DEFAULT_CREATE_CDA_TOKEN = true;

export const DELETE_FEATURE = booleanOr(INPUT_DELETE_FEATURE, DEFAULT_DELETE_FEATURE);
export const CREATE_CDA_TOKEN = booleanOr(INPUT_CREATE_CDA_TOKEN, DEFAULT_CREATE_CDA_TOKEN);
export const SET_ALIAS = booleanOr(INPUT_SET_ALIAS, DEFAULT_SET_ALIAS);

// Set default actions to respect legacy input ENV's. This will make the new version backwards compatible.
export const DEFAULT_ACTIONS = [
  'createEnvironment',
  CREATE_CDA_TOKEN && 'createCDAToken',
  'applyMigration',
  SET_ALIAS && 'updateAlias',
  DELETE_FEATURE && 'cleanUpEnvironments',
].filter(Boolean);

export const VERSION_CONTENT_TYPE = INPUT_VERSION_CONTENT_TYPE ?? DEFAULT_VERSION_CONTENT_TYPE;
export const FEATURE_PATTERN = INPUT_FEATURE_PATTERN ?? DEFAULT_FEATURE_PATTERN;
export const MASTER_PATTERN = INPUT_MASTER_PATTERN ?? DEFAULT_MASTER_PATTERN;
export const VERSION_FIELD = INPUT_VERSION_FIELD ?? DEFAULT_VERSION_FIELD;

if (!GITHUB_WORKSPACE) {
  throw Error("MUST specify GITHUB_WORKSPACE in process env")
}
export const MIGRATIONS_DIR = path.join(GITHUB_WORKSPACE, INPUT_MIGRATIONS_DIR ?? DEFAULT_MIGRATIONS_DIR);

export const CONTENTFUL_ALIAS = INPUT_CONTENTFUL_ALIAS ?? DEFAULT_CONTENTFUL_ALIAS;
export const DELAY = Number(INPUT_DELAY ?? DEFAULT_DELAY);
export const MAX_NUMBER_OF_TRIES = Number(INPUT_MAX_NUMBER_OF_TRIES ?? DEFAULT_MAX_NUMBER_OF_TRIES);
export const DEFAULT_BRANCH_NAME = INPUT_DEFAULT_BRANCH_NAME ?? null;

export const ACTIONS = INPUT_ACTIONS?.trim()?.split(/,\s*/) ?? DEFAULT_ACTIONS;
