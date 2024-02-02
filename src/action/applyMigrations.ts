import { readdir } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import toSemver from 'to-semver';
import type { Environment } from 'contentful-management';
import { runMigration } from 'contentful-migration';
import { MANAGEMENT_API_KEY, MIGRATIONS_DIR, SPACE_ID, VERSION_CONTENT_TYPE, VERSION_FIELD } from '../constants';
import { Logger, filenameToVersion, versionToFilename } from '../utils';

export const readdirAsync = promisify(readdir);

export default async function ({ environment, defaultLocale }: { environment: Environment; defaultLocale: string }) {
  Logger.verbose('Read all the available migrations from the file system');
  // Check for available migrations
  // Migration scripts need to be sorted in order to run without conflicts
  const migrationScripts = await readdirAsync(MIGRATIONS_DIR);

  const availableMigrations = toSemver(
    migrationScripts.map((file) => filenameToVersion(file)),
    { clean: false },
  ).reverse();

  Logger.verbose(`versionOrder: ${JSON.stringify(availableMigrations, null, 4)}`);

  Logger.verbose('Find current version of the contentful space');
  const { items: versions } = await environment.getEntries({
    content_type: VERSION_CONTENT_TYPE,
  });

  // If there is no entry or more than one of CONTENTFUL_VERSION_TRACKING
  // Then throw an Error and abort
  if (versions.length === 0) {
    throw new Error(`There should be exactly one entry of type "${VERSION_CONTENT_TYPE}"`);
  }

  if (versions.length > 1) {
    throw new Error(`There should only be one entry of type "${VERSION_CONTENT_TYPE}"`);
  }

  const [storedVersionEntry] = versions;
  const currentVersionString = storedVersionEntry.fields[VERSION_FIELD][defaultLocale];

  Logger.verbose('Evaluate which migrations to run');
  const currentMigrationIndex = availableMigrations.indexOf(currentVersionString);

  // If the migration can't be found
  // Then abort
  if (currentMigrationIndex === -1) {
    throw new Error(`Version ${currentVersionString} is not matching with any known migration`);
  }

  const migrationsToRun = availableMigrations.slice(currentMigrationIndex + 1);
  const migrationOptions = {
    spaceId: SPACE_ID,
    environmentId: environment.sys.id,
    accessToken: MANAGEMENT_API_KEY,
    yes: true,
  };

  Logger.verbose('Run migrations and update version entry');
  // Allow mutations
  let migrationToRun;
  let lastMigration;

  /* eslint-disable no-await-in-loop */
  while ((migrationToRun = migrationsToRun.shift())) {
    const filePath = path.join(MIGRATIONS_DIR, versionToFilename(migrationToRun));
    Logger.verbose(`Running ${filePath}`);
    await runMigration(
      Object.assign(migrationOptions, {
        filePath,
      }),
    );
    lastMigration = migrationToRun;
    Logger.success(`Migration script ${migrationToRun}.js succeeded`);
  }

  if (lastMigration) {
    storedVersionEntry.fields.version[defaultLocale] = lastMigration;
    const updatedVersionEntry = await storedVersionEntry.update();
    await updatedVersionEntry.publish();
  }

  Logger.success(`Updated field ${VERSION_FIELD} in ${VERSION_CONTENT_TYPE} entry to ${migrationToRun}`);
  /* eslint-enable no-await-in-loop */
}
