import { type Environment } from 'contentful-management/dist/typings/entities/environment';
export type BranchNames = {
    headRef: null | string;
    baseRef: string;
    defaultBranch: string;
};
export type EnvironmentNames = {
    base: string;
    head: string | null;
};
export type EnvironmentProps = {
    environmentType: string;
    environmentNames: EnvironmentNames;
    environmentId: string;
    environment: Environment;
};
export type NameFromPatternArgs = {
    branchName: string | null;
};
