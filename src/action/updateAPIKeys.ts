import * as core from "@actions/core";
import type { Environment, Space } from "contentful-management";
import { Logger } from "../utils";

export default async function ({ space, tokenKeyName, environment }: { space: Space, tokenKeyName: string, environment: Environment }) {

    Logger.verbose("Update API Keys to allow access to new environment");

    const { items: keys } = await space.getApiKeys();
    await Promise.all(
        keys.map((key) => {
            // put token value on every action run
            // helpful in case the first run failed and the "Write Comment" step was not reached
            if (key.name === tokenKeyName) {
                Logger.verbose("debug: setting ephemeral token value to ouputs");
                core.setOutput("cda_token", key.accessToken);
                core.setSecret(key.accessToken) // set token as a secret after you've put it in the output!
            }

            Logger.verbose(`Updating key named "${key.name}" with ID:"${key.sys.id}"`);
            key.environments.push({
                sys: {
                    type: "Link",
                    linkType: "Environment",
                    id: environment.sys.id,
                },
            });
            return key.update();
        })
    );
}