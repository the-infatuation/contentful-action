/// <reference types="node" />
import { readdir } from 'node:fs';
import type { Environment } from 'contentful-management';
export declare const readdirAsync: typeof readdir.__promisify__;
export default function ({ environment, defaultLocale }: {
    environment: Environment;
    defaultLocale: string;
}): Promise<void>;
