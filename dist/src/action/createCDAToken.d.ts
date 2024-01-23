import type { Environment, Space } from 'contentful-management';
export default function ({ space, tokenKeyName, environment, }: {
    space: Space;
    tokenKeyName: string;
    environment: Environment;
}): Promise<void>;
