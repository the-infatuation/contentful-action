import type { Environment, Space } from 'contentful-management';
import { CONTENTFUL_ALIAS } from '../constants';
import { Logger } from '../utils';

export default async function ({
  environmentType,
  space,
  environment,
}: {
  environmentType: string;
  space: Space;
  environment: Environment;
}) {
  Logger.log(`Checking if we need to update ${CONTENTFUL_ALIAS} alias`);
  // If the environmentType is ${CONTENTFUL_ALIAS} ("master")
  // Then set the alias to the new environment
  // Else inform the user

  if (environmentType === CONTENTFUL_ALIAS) {
    Logger.log(`Running on ${CONTENTFUL_ALIAS}.`);
    Logger.log(`Updating ${CONTENTFUL_ALIAS} alias.`);
    await space
      .getEnvironmentAlias(CONTENTFUL_ALIAS)
      .then(async (alias) => {
        alias.environment.sys.id = environment.sys.id;

        return alias.update();
      })
      .then((alias) => {
        Logger.success(`alias ${alias.sys.id} updated.`);
      })
      .catch(Logger.error);
  } else {
    Logger.verbose('Running on feature branch');
    Logger.verbose('No alias changes required');
  }
}
