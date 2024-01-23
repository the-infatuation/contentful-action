import type { Space } from 'contentful-management';
import type { BranchNames } from '../types';
export default function ({ space, tokenKeyName, branchNames, }: {
    space: Space;
    tokenKeyName: string;
    branchNames: BranchNames;
}): Promise<void>;
