"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BRANCH_NAME = exports.CREATE_CDA_TOKEN = exports.MAX_NUMBER_OF_TRIES = exports.DELAY = exports.CONTENTFUL_ALIAS = exports.MIGRATIONS_DIR = exports.SET_ALIAS = exports.DELETE_FEATURE = exports.VERSION_FIELD = exports.MASTER_PATTERN = exports.FEATURE_PATTERN = exports.VERSION_CONTENT_TYPE = exports.DEFAULT_CREATE_CDA_TOKEN = exports.DEFAULT_MAX_NUMBER_OF_TRIES = exports.DEFAULT_DELAY = exports.DEFAULT_CONTENTFUL_ALIAS = exports.DEFAULT_SET_ALIAS = exports.DEFAULT_DELETE_FEATURE = exports.DEFAULT_VERSION_FIELD = exports.DEFAULT_VERSION_CONTENT_TYPE = exports.DEFAULT_FEATURE_PATTERN = exports.DEFAULT_MASTER_PATTERN = exports.DEFAULT_MIGRATIONS_DIR = exports.INPUT_DEFAULT_BRANCH_NAME = exports.INPUT_CREATE_CDA_TOKEN = exports.INPUT_MAX_NUMBER_OF_TRIES = exports.INPUT_DELAY = exports.INPUT_CONTENTFUL_ALIAS = exports.INPUT_VERSION_FIELD = exports.INPUT_VERSION_CONTENT_TYPE = exports.INPUT_MASTER_PATTERN = exports.INPUT_FEATURE_PATTERN = exports.INPUT_SET_ALIAS = exports.INPUT_DELETE_FEATURE = exports.INPUT_MIGRATIONS_DIR = exports.MANAGEMENT_API_KEY = exports.SPACE_ID = exports.LOG_LEVEL = exports.GITHUB_WORKSPACE = void 0;
const path_1 = __importDefault(require("path"));
_a = process.env, exports.GITHUB_WORKSPACE = _a.GITHUB_WORKSPACE, exports.LOG_LEVEL = _a.LOG_LEVEL, exports.SPACE_ID = _a.INPUT_SPACE_ID, exports.MANAGEMENT_API_KEY = _a.INPUT_MANAGEMENT_API_KEY, exports.INPUT_MIGRATIONS_DIR = _a.INPUT_MIGRATIONS_DIR, exports.INPUT_DELETE_FEATURE = _a.INPUT_DELETE_FEATURE, exports.INPUT_SET_ALIAS = _a.INPUT_SET_ALIAS, exports.INPUT_FEATURE_PATTERN = _a.INPUT_FEATURE_PATTERN, exports.INPUT_MASTER_PATTERN = _a.INPUT_MASTER_PATTERN, exports.INPUT_VERSION_CONTENT_TYPE = _a.INPUT_VERSION_CONTENT_TYPE, exports.INPUT_VERSION_FIELD = _a.INPUT_VERSION_FIELD, exports.INPUT_CONTENTFUL_ALIAS = _a.INPUT_CONTENTFUL_ALIAS, exports.INPUT_DELAY = _a.INPUT_DELAY, exports.INPUT_MAX_NUMBER_OF_TRIES = _a.INPUT_MAX_NUMBER_OF_TRIES, exports.INPUT_CREATE_CDA_TOKEN = _a.INPUT_CREATE_CDA_TOKEN, exports.INPUT_DEFAULT_BRANCH_NAME = _a.INPUT_DEFAULT_BRANCH_NAME;
const booleanOr = (str, fallback) => {
    switch (str) {
        case "true":
            return true;
        case "false":
            return false;
        default:
            return fallback;
    }
};
exports.DEFAULT_MIGRATIONS_DIR = "migrations";
exports.DEFAULT_MASTER_PATTERN = "master-[YYYY]-[MM]-[DD]-[mm][ss]";
exports.DEFAULT_FEATURE_PATTERN = "GH-[branch]";
exports.DEFAULT_VERSION_CONTENT_TYPE = "versionTracking";
exports.DEFAULT_VERSION_FIELD = "version";
exports.DEFAULT_DELETE_FEATURE = false;
exports.DEFAULT_SET_ALIAS = false;
exports.DEFAULT_CONTENTFUL_ALIAS = "master";
exports.DEFAULT_DELAY = 3000;
exports.DEFAULT_MAX_NUMBER_OF_TRIES = 10;
exports.DEFAULT_CREATE_CDA_TOKEN = true;
exports.VERSION_CONTENT_TYPE = exports.INPUT_VERSION_CONTENT_TYPE || exports.DEFAULT_VERSION_CONTENT_TYPE;
exports.FEATURE_PATTERN = exports.INPUT_FEATURE_PATTERN || exports.DEFAULT_FEATURE_PATTERN;
exports.MASTER_PATTERN = exports.INPUT_MASTER_PATTERN || exports.DEFAULT_MASTER_PATTERN;
exports.VERSION_FIELD = exports.INPUT_VERSION_FIELD || exports.DEFAULT_VERSION_FIELD;
exports.DELETE_FEATURE = booleanOr(exports.INPUT_DELETE_FEATURE, exports.DEFAULT_DELETE_FEATURE);
exports.SET_ALIAS = booleanOr(exports.INPUT_SET_ALIAS, exports.DEFAULT_SET_ALIAS);
exports.MIGRATIONS_DIR = path_1.default.join(exports.GITHUB_WORKSPACE, exports.INPUT_MIGRATIONS_DIR || exports.DEFAULT_MIGRATIONS_DIR);
exports.CONTENTFUL_ALIAS = exports.INPUT_CONTENTFUL_ALIAS || exports.DEFAULT_CONTENTFUL_ALIAS;
exports.DELAY = Number(exports.INPUT_DELAY || exports.DEFAULT_DELAY);
exports.MAX_NUMBER_OF_TRIES = Number(exports.INPUT_MAX_NUMBER_OF_TRIES || exports.DEFAULT_MAX_NUMBER_OF_TRIES);
exports.CREATE_CDA_TOKEN = booleanOr(exports.INPUT_CREATE_CDA_TOKEN, exports.DEFAULT_CREATE_CDA_TOKEN);
exports.DEFAULT_BRANCH_NAME = exports.INPUT_DEFAULT_BRANCH_NAME || null;
//# sourceMappingURL=constants.js.map