import { containsEnvironmentId, createAllowPolicyForEnvironment } from './role';

describe('containsEnvironmentId', () => {
  const policies = [
    {
      effect: 'allow',
      constraint: {
        and: [
          {
            equals: [{ doc: 'sys.type' }, 'Entry'],
          },
        ],
      },
      actions: 'all',
    },
    {
      effect: 'deny',
      constraint: {
        and: [
          {
            equals: [{ doc: 'sys.type' }, 'Entry'],
          },
        ],
      },
      actions: ['delete'],
    },
    {
      effect: 'allow',
      constraint: {
        and: [
          {
            equals: [{ doc: 'sys.type' }, 'Asset'],
          },
        ],
      },
      actions: 'all',
    },
    {
      effect: 'allow',
      constraint: {
        and: [
          {
            equals: [{ doc: 'sys.type' }, 'Environment'],
          },
          {
            equals: [{ doc: 'sys.id' }, 'development'],
          },
        ],
      },
      actions: ['access'],
    },
    {
      effect: 'allow',
      constraint: {
        and: [
          {
            equals: [{ doc: 'sys.type' }, 'Environment'],
          },
          {
            equals: [{ doc: 'sys.id' }, 'e2e'],
          },
        ],
      },
      actions: ['access'],
    },
    {
      effect: 'allow',
      constraint: {
        and: [
          {
            equals: [{ doc: 'sys.type' }, 'Environment'],
          },
          {
            equals: [{ doc: 'sys.id' }, 'staging-202403181545'],
          },
        ],
      },
      actions: ['access'],
    },
  ];

  test('returns true when environmentId is found in policies', () => {
    const environmentId = 'development';
    const result = policies.some((policy) => containsEnvironmentId(policy.constraint, environmentId));
    expect(result).toBe(true);
  });

  test('returns false when environmentId is not found in any policy', () => {
    const environmentId = 'non-existent-env';
    const result = policies.some((policy) => containsEnvironmentId(policy.constraint, environmentId));
    expect(result).toBe(false);
  });
});

describe('createAllowPolicyForEnvironment', () => {
  test('creates an allow policy for a given environment ID', () => {
    const environmentId = 'development';
    const expectedPolicy = {
      effect: 'allow',
      constraint: {
        and: [{ equals: [{ doc: 'sys.type' }, 'Environment'] }, { equals: [{ doc: 'sys.id' }, environmentId] }],
      },
      actions: ['access'],
    };

    const result = createAllowPolicyForEnvironment(environmentId);

    expect(result).toEqual(expectedPolicy);
  });
});
