import * as github from '@actions/github';
import type { Space } from 'contentful-management';
import { CREATE_CDA_TOKEN, FEATURE_PATTERN } from '../constants';
import { Logger, getNameFromPattern } from '../utils';
import type { BranchNames } from '../types';

export default async function ({
  space,
  tokenKeyName,
  branchNames,
}: {
  space: Space;
  tokenKeyName: string;
  branchNames: BranchNames;
}) {
  // "closed" action happens on PR close and PR merge
  const githubAction = github.context.payload.action;

  // If CDA token is created and we want to purge ephemeral env upon close/merge
  // then ephemeral token should be deleted as well
  if (CREATE_CDA_TOKEN && githubAction === 'closed') {
    Logger.verbose(`debug: attempting to delete ${tokenKeyName}`);

    const { items: keys } = await space.getApiKeys();
    const k = keys.find((key) => key.name === tokenKeyName);

    if (k === undefined) {
      Logger.warn(`could not find ephemeral token ${tokenKeyName}, possibly it was deleted manually`);
    } else {
      try {
        await k.delete();
        Logger.success(`removed ephemeral token ${tokenKeyName}`);
      } catch (error) {
        Logger.error('Unable to delete ephemeral token');
        Logger.verbose(error);
      }
    }
  }

  // If the sandbox environment should be deleted
  // And the baseRef is the repository default_branch (master|main ...)
  // And the Pull Request has been merged
  // Then delete the sandbox environment
  if (githubAction === 'closed') {
    try {
      const environmentIdToDelete = getNameFromPattern(FEATURE_PATTERN, {
        branchName: branchNames.headRef,
      });
      Logger.log(`Delete the environment: ${environmentIdToDelete}`);
      const environment = await space.getEnvironment(environmentIdToDelete);
      await environment?.delete();
      Logger.success(`Deleted the environment: ${environmentIdToDelete}`);
    } catch {
      Logger.error('Cannot delete the environment');
    }
  }
}
