import * as core from "@actions/core";
import { createClient } from "contentful-management";
import { runAction } from "./action";
import { MANAGEMENT_API_KEY, SPACE_ID } from "./constants";
import { Logger } from "./utils";
import * as github from "@actions/github";

(async () => {
  const client = createClient({
    accessToken: MANAGEMENT_API_KEY,
  });
  const space = await client.getSpace(SPACE_ID);
  try {
    await runAction(space);
  } catch (error) {
    Logger.error(error);
    core.setFailed(error.message);
  }

  Logger.log("payload " + github.context.payload)
  Logger.log("enentName " + github.context.payload.eventName)
  Logger.log("sha " + github.context.payload.sha)
  Logger.log("ref " + github.context.payload.ref)
  Logger.log("workflow " + github.context.payload.workflow)
  Logger.log("action " + github.context.payload.action)
  Logger.log("actor " + github.context.payload.actor)
})();
