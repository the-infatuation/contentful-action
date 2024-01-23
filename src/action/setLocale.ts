import type { Environment } from 'contentful-management';
import { Logger } from '../utils';

export default async function ({ environment }: { environment: Environment }) {
  Logger.verbose('Set default locale to new environment');

  const locales = await environment.getLocales();

  return locales.items.find((locale) => locale.default)?.code ?? 'en-US';
}
