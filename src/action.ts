import * as core from '@actions/core';
import type { Environment, Space } from 'contentful-management';
import { ACTIONS, CONTENTFUL_ALIAS } from './constants';
import { getBranchNames, Logger } from './utils';
import setLocale from './action/setLocale';
import updateAPIKeys from './action/updateAPIKeys';
import createCDAToken from './action/createCDAToken';
import createEnvironment from './action/createEnvironment';
import applyMigrations from './action/applyMigrations';
import updateAlias from './action/updateAlias';
import cleanUpEnvironments from './action/cleanUpEnvironments';
import updateRoleEnvironmentAccess from './action/updateRoleEnvironmentAccess';

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

  let targetEnvironment: Environment | null = null;
  let newEnvironmentType: string | null = null;
  let backupEnvironment: Environment | null = null;

  if (ACTIONS.includes('createEnvironment')) {
    const { environment, environmentType } = await createEnvironment({ space, branchNames });
    targetEnvironment = environment;
    newEnvironmentType = environmentType;
  } else {
    targetEnvironment = await space.getEnvironment(CONTENTFUL_ALIAS);
  }

  if (ACTIONS.includes('backupEnvironment')) {
    // Creating, but ignoring the returned environment. It's a backup.
    const createdEnv = await createEnvironment({ space, branchNames });
    backupEnvironment = createdEnv.environment;
  }

  if (ACTIONS.includes('createCDAToken')) {
    // Replaces CREATE_CDA_TOKEN env
    await createCDAToken({ space, tokenKeyName, environment: targetEnvironment });

    if (ACTIONS.includes('createEnvironment')) {
      await updateAPIKeys({ space, tokenKeyName, environment: targetEnvironment });
    }
    if (backupEnvironment) {
      await updateAPIKeys({ space, tokenKeyName, environment: backupEnvironment });
    }
  }

  if (ACTIONS.includes('updateRoleEnvironmentAccess') && ACTIONS.includes('createEnvironment')) {
    await updateRoleEnvironmentAccess({ space, environment: targetEnvironment });
  }

  const defaultLocale = await setLocale({ environment: targetEnvironment });

  if (ACTIONS.includes('applyMigrations')) {
    await applyMigrations({ environment: targetEnvironment, defaultLocale });
  }

  if (ACTIONS.includes('updateAlias') && newEnvironmentType) {
    await updateAlias({ environmentType: newEnvironmentType, space, environment: targetEnvironment });
  }

  if (ACTIONS.includes('cleanUpEnvironments')) {
    // Replaces DELETE_FEATURE env
    await cleanUpEnvironments({ space, tokenKeyName, branchNames });
  }

  // Set the outputs for further actions
  core.setOutput(
    'environment_url',
    `https://app.contentful.com/spaces/${space.sys.id}/environments/${targetEnvironment.sys.id}`,
  );
  core.setOutput('environment_name', targetEnvironment.sys.id);
  Logger.success('🚀 All done 🚀');
};
