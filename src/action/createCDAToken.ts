import type { Environment, Space } from 'contentful-management';
import { Logger } from '../utils';

export default async function ({
  space,
  tokenKeyName,
  environment,
}: {
  space: Space;
  tokenKeyName: string;
  environment: Environment;
}) {
  const spaceKeys = await space.getApiKeys();

  const exists = spaceKeys.items.some((item) => item.name === tokenKeyName);

  if (exists) {
    Logger.log(`CDA token ${tokenKeyName} is already created`);
  } else {
    Logger.log(`Creating new CDA token "${tokenKeyName}" for ephemeral environment "${environment.sys.id}"...`);

    try {
      // Olex QQ: ... new key never returned / used?
      await space.createApiKey({
        name: tokenKeyName,
        environments: [
          {
            sys: {
              type: 'Link',
              linkType: 'Environment',
              id: environment.sys.id,
            },
          },
        ],
      });

      Logger.success('CDA token has been created');
    } catch (error) {
      Logger.warn('unable to create ephemeral token');
      Logger.verbose(error);
    }
  }
}
