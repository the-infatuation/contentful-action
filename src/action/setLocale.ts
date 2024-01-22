import type { Environment } from 'contentful-management';
import { Logger } from '../utils';

export default async function ({ environment }: { environment: Environment }) {
  Logger.verbose('Set default locale to new environment');

  return (await environment.getLocales()).items.find((locale) => locale.default).code;
}
