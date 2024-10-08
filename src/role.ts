import { type ActionType, type ConstraintType, type RoleProps } from 'contentful-management/dist/typings/entities/role';

export function containsEnvironmentId(constraint: ConstraintType, environmentId: string): boolean {
  for (const key in constraint) {
    if (key === 'equals') {
      const equalsConstraint = constraint[key];
      if (
        Array.isArray(equalsConstraint) &&
        equalsConstraint[0].doc === 'sys.id' &&
        equalsConstraint[1] === environmentId
      ) {
        return true;
      }
    } else if (Array.isArray(constraint[key])) {
      for (const subConstraint of constraint[key]) {
        if (containsEnvironmentId(subConstraint, environmentId)) {
          return true;
        }
      }
    } else if (typeof constraint[key] === 'object' && containsEnvironmentId(constraint[key], environmentId)) {
      return true;
    }
  }

  return false;
}

export function removePolicyByEnvironmentId(
  role: RoleProps,
  environmentId: string,
): {
  effect: string;
  actions: ActionType[] | 'all';
  constraint: ConstraintType;
}[] {
  return role.policies.filter((policy) => !containsEnvironmentId(policy.constraint, environmentId));
}

export function createAllowPolicyForEnvironment(environmentId: string): {
  effect: string;
  actions: 'all' | ActionType[];
  constraint: ConstraintType;
} {
  return {
    effect: 'allow',
    constraint: {
      and: [{ equals: [{ doc: 'sys.type' }, 'Environment'] }, { equals: [{ doc: 'sys.id' }, environmentId] }],
    },
    // We want to keep the same behavior on the role and be able to manage it via the UI, so 'access' is a valid value
    // and is assigned when an environment is added via the UI; assigning any other value would make the role unmanageable through the UI.
    // @ts-expect-error 'access' is a valid value when an Env is assigned via UI
    actions: ['access'],
  };
}
