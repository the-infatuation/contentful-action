import type { Space } from 'contentful-management';
import type { BranchNames } from '../types';
export default function ({ space, branchNames }: {
    space: Space;
    branchNames: BranchNames;
}): Promise<{
    environment: import("contentful-management").Environment;
    environmentType: string;
}>;
