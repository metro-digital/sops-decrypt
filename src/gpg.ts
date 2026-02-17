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

import { commandExec } from "./command.js";
import { info as coreInfo, saveState as coreSaveState } from "@actions/core";

export async function gpgImportKey(base64GPGKey: string) {
  const gpgKey = Buffer.from(base64GPGKey, "base64").toString();
  const gpgArgs = ["--import"];

  coreInfo("Importing the gpg key");
  const result = await commandExec("gpg", gpgArgs, gpgKey);
  if (!result.status) {
    coreInfo("Failed importing the GPG key");
    throw new Error(`Importing of GPG key failed: ${result.error}`);
  }

  coreInfo("Successfully imported the gpg key");
  coreSaveState("GPG_KEY", base64GPGKey);
}

export async function gpgFingerprint(base64GPGKey: string) {
  const gpgKey = Buffer.from(base64GPGKey, "base64").toString();
  const gpgArgs = ["--with-colons", "--import-options", "show-only", "--import", "--fingerprint"];

  const gpgResult = await commandExec("gpg", gpgArgs, gpgKey);
  if (!gpgResult.status) {
    throw new Error(`Unable to get the fingerprint of the gpg key: ${gpgResult.error}`);
  }

  /**
   * Output of above gpg call is as follows:
   *
   * sec:-:2048:1:A344AC03500C6401:1594233019:::-:::escaESCA::::::23::0:
   * fpr:::::::::B4226A1192494789A9402116A344AC03500C6401:
   * grp:::::::::B202A8890617B36D91BB0BBB6AE81C90B91D855E:
   * uid:-::::1594233019::1936E9CF3341B6EA8C41249F913982ECD506EE96::root <root@some-fake-domain.org>::::::::::0:
   * ssb:-:2048:1:56FEEEE45BC6F34A:1594233019::::::esa::::::23:
   * fpr:::::::::60FD47A6A6D745043B57AE3556FEEEE45BC6F34A:
   * grp:::::::::34E2DF99E3BDA0E8DE6FC9FE521CD1EC8B719E1C:
   */

  const fingerprints = gpgResult.output;
  const startIndex = fingerprints.indexOf("fpr") + 3;
  const endIndex = fingerprints.indexOf("\n", startIndex);

  return fingerprints.slice(startIndex, endIndex).replace(/[^a-zA-Z0-9]/g, "");
}

export async function gpgDeleteSecretKey(fingerprint: string) {
  const gpgArgs = ["--batch", "--yes", "--delete-secret-keys", fingerprint];

  coreInfo("Deleting the private gpg key");
  const result = await commandExec("gpg", gpgArgs);
  coreInfo("Deleted the private gpg key");
  if (!result.status) {
    throw new Error(`Deleting private GPG key failed: ${result.error}`);
  }
}

export async function gpgDeletePublicKey(fingerprint: string) {
  const gpgArgs = ["--batch", "--yes", "--delete-keys", fingerprint];

  coreInfo("Deleting the public gpg key");
  const result = await commandExec("gpg", gpgArgs);
  coreInfo("Deleted the public gpg key");
  if (!result.status) {
    throw new Error(`Deleting gpg public key failed: ${result.error}`);
  }
}

export async function gpgDeleteKey(fingerprint: string) {
  await gpgDeleteSecretKey(fingerprint);
  await gpgDeletePublicKey(fingerprint);
}

export async function gpgKeyExists(fingerprint: string) {
  const gpgArgs = ["--list-secret-keys", fingerprint];
  const result = await commandExec("gpg", gpgArgs);

  return result.status;
}
