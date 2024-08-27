/*
 * Copyright 2021 METRO Digital GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as core from "@actions/core";
import * as gpg from "./gpg";

export async function run() {
  const gpgKey = core.getState("GPG_KEY");
  try {
    if (gpgKey) {
      core.info("Getting the fingerprint");
      const fingerprint = await gpg.fingerprint(gpgKey);
      core.info("Got the fingerprint");
      if (await gpg.keyExists(fingerprint)) {
        core.info("Deleting the imported gpg key");
        await gpg.deleteKey(fingerprint);
        core.info("Successfully deleted the imported gpg key");
      } else {
        core.info("GPG key does not exist");
      }
    }
  } catch (e: unknown) {
    core.setFailed(`Error while deleting the gpg key ${(e as Error).message}`);
    throw new Error(`Error while deleting the gpg key: ${(e as Error).message}`);
  }
}

run().catch((e) => {
  core.setFailed(e.message);
});
