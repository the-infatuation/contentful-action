import * as core from '@actions/core';
import { createClient } from 'contentful-management';
import { runAction } from './action.js'; // action.yml conflict
import { MANAGEMENT_API_KEY, SPACE_ID } from './constants';
import { Logger } from './utils';

if (!MANAGEMENT_API_KEY) {
  throw new Error('Requires Contentful Access Token in: process.env.INPUT_MANAGEMENT_API_KEY');
}

if (!SPACE_ID) {
  throw new Error('Requires Contentful Space ID in: process.env.INPUT_SPACE_ID');
}

const client = createClient({
  accessToken: MANAGEMENT_API_KEY,
});

/* eslint-disable unicorn/prefer-top-level-await */
(async () => {
  const space = await client.getSpace(SPACE_ID);
  try {
    await runAction(space);
  } catch (error) {
    Logger.error(error);
    core.setFailed(error.message);
  }
})();
/* eslint-enable unicorn/prefer-top-level-await */
