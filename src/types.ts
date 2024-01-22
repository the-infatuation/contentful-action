import { type Environment } from 'contentful-management/dist/typings/entities/environment';

export enum EventNames {
  pullRequest = 'pull_request',
}

export type BranchNames = {
  headRef: undefined | string;
  baseRef: string;
  defaultBranch: string;
};

export type EnvironmentNames = {
  base: string;
  head: string | undefined;
};

export type EnvironmentProps = {
  environmentType: string;
  environmentNames: EnvironmentNames;
  environmentId: string;
  environment: Environment;
};

export type NameFromPatternArgs = {
  branchName?: string;
};
