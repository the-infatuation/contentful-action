import type { Environment, Space } from 'contentful-management';
import { Logger, delay, getEnvironment } from '../utils';
import type { BranchNames } from '../types';
import { MAX_NUMBER_OF_TRIES } from '../constants';

export default async function ({ space, branchNames }: { space: Space; branchNames: BranchNames }) {
  const { environmentId, environment, environmentType } = await getEnvironment(space, branchNames);

  // Counter to limit retries
  let count = 0;
  Logger.log('Waiting for environment processing...');
  while (count < MAX_NUMBER_OF_TRIES) {
    const status = (await space.getEnvironment(environment.sys.id)).sys.status.sys.id;

    if (status === 'ready') {
      Logger.success(`Successfully processed new environment: "${environmentId}"`);
      break;
    }

    if (status === 'failed') {
      Logger.warn('Environment creation failed');
      break;
    }

    await delay();
    count++;
  }

  if (count >= MAX_NUMBER_OF_TRIES) {
    Logger.warn('Environment never returned ready. Try increasing your delay or tries.');
    Logger.warn('Continuing action, but expect a failure.');
  }

  return {
    environment,
    environmentType,
  };
}
