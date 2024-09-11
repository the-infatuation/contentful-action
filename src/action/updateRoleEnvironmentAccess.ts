import type { Environment, Space } from 'contentful-management';
import { createAllowPolicyForEnvironment } from '../role';
import { INPUT_UPDATE_ENVIRONMENT_ACCESS_ROLE_ID } from '../constants';
import { Logger } from '../utils';

export default async function ({ space, environment }: { space: Space; environment: Environment }) {
  const roleId: string = INPUT_UPDATE_ENVIRONMENT_ACCESS_ROLE_ID!;
  try {
    Logger.log(`Updating the Role ${roleId} to have access on Environment: ${environment.sys.id}.`);
    const role = await space.getRole(roleId);

    let isEnvironmentIdInRolePolicy = false;
    for (const policy of role.policies) {
      if (environment.sys.id === policy.constraint.and[1].equals[1]) {
        isEnvironmentIdInRolePolicy = true;
      }
    }

    if (!isEnvironmentIdInRolePolicy) role.policies.push(createAllowPolicyForEnvironment(environment.sys.id));
    await role.update();
    Logger.success(`Successfully updated the Role ${roleId} with Environment ${environment.sys.id}.`);
  } catch (error) {
    Logger.error(`Failed to update the Role ${roleId} with Environment ${environment.sys.id}.`);
    Logger.verbose(error);
  }
}
