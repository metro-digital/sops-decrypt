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

import { info as coreInfo, getState as coreGetState, setFailed as coreSetFailed } from "@actions/core";
import { gpgFingerprint, gpgKeyExists, gpgDeleteKey } from "./gpg.js";

export async function postActionRun() {
  const gpgKey = coreGetState("GPG_KEY");
  try {
    if (gpgKey) {
      coreInfo("Getting the fingerprint");
      const fingerprint = await gpgFingerprint(gpgKey);
      coreInfo("Got the fingerprint");
      if (await gpgKeyExists(fingerprint)) {
        coreInfo("Deleting the imported gpg key");
        await gpgDeleteKey(fingerprint);
        coreInfo("Successfully deleted the imported gpg key");
      } else {
        coreInfo("GPG key does not exist");
      }
    }
  } catch (e: unknown) {
    coreSetFailed(`Error while deleting the gpg key ${(e as Error).message}`);
    throw new Error(`Error while deleting the gpg key: ${(e as Error).message}`);
  }
}

await postActionRun().catch((e) => {
  coreSetFailed(e.message);
});
