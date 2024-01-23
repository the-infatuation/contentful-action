import type { Space } from 'contentful-management';
/**
 * This is a synchronous implementation of runAction - events happen in order, always.
 * TODO: Consider allowing all actions to be run in any order. Would create a few dependencies,
 * but would also open up more novel workflows. Recommend changing when needed.
 *
 * @param space
 */
export declare const runAction: (space: Space) => Promise<void>;
