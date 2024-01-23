import type { Environment, Space } from 'contentful-management';
export default function ({ environmentType, space, environment, }: {
    environmentType: string;
    space: Space;
    environment: Environment;
}): Promise<void>;
