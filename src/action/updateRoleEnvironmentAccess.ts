import type { Environment, Space } from 'contentful-management';
import { containsEnvironmentId, createAllowPolicyForEnvironment } from '../role';
import { INPUT_UPDATE_ENVIRONMENT_ACCESS_ROLE_ID } from '../constants';
import { Logger } from '../utils';

export default async function ({ space, environment }: { space: Space; environment: Environment }) {
  const roleId: string = INPUT_UPDATE_ENVIRONMENT_ACCESS_ROLE_ID!;
  try {
    Logger.log(`Updating the Role ${roleId} to have access on Environment: ${environment.sys.id}.`);
    const role = await space.getRole(roleId);
    const isEnvironmentIdInRolePolicy = role.policies.some((policy) =>
      containsEnvironmentId(policy.constraint, environment.sys.id),
    );
    if (isEnvironmentIdInRolePolicy) {
      Logger.log(`The Role ${roleId} has already been given access to Environment ${environment.sys.id}.`);
      return; // eslint-disable-line padding-line-between-statements
    }
    role.policies.push(createAllowPolicyForEnvironment(environment.sys.id));
    await role.update();
    Logger.success(`Successfully updated the Role ${roleId} with Environment ${environment.sys.id}.`);
  } catch (error) {
    Logger.error(`Failed to update the Role ${roleId} with Environment ${environment.sys.id}.`);
    Logger.verbose(error);
  }
}
