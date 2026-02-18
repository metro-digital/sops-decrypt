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

import * as command from "./command";
import * as core from "@actions/core";

export async function importKey(base64GPGKey: string) {
  const gpgKey = Buffer.from(base64GPGKey, "base64").toString();
  const gpgArgs = ["--import"];

  core.info("Importing the gpg key");
  const result = await command.exec("gpg", gpgArgs, gpgKey);
  if (!result.status) {
    core.info("Failed importing the GPG key");
    throw new Error(`Importing of GPG key failed: ${result.error}`);
  }

  core.info("Successfully imported the gpg key");
  core.saveState("GPG_KEY", base64GPGKey);
}

export async function fingerprint(base64GPGKey: string) {
  const gpgKey = Buffer.from(base64GPGKey, "base64").toString();
  const gpgArgs = ["--with-colons", "--import-options", "show-only", "--import", "--fingerprint"];

  const gpgResult = await command.exec("gpg", gpgArgs, gpgKey);
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

export async function deleteSecretKey(fingerprint: string) {
  const gpgArgs = ["--batch", "--yes", "--delete-secret-keys", fingerprint];

  core.info("Deleting the private gpg key");
  const result = await command.exec("gpg", gpgArgs);
  core.info("Deleted the private gpg key");
  if (!result.status) {
    throw new Error(`Deleting private GPG key failed: ${result.error}`);
  }
}

export async function deletePublicKey(fingerprint: string) {
  const gpgArgs = ["--batch", "--yes", "--delete-keys", fingerprint];

  core.info("Deleting the public gpg key");
  const result = await command.exec("gpg", gpgArgs);
  core.info("Deleted the public gpg key");
  if (!result.status) {
    throw new Error(`Deleting gpg public key failed: ${result.error}`);
  }
}

export async function deleteKey(fingerprint: string) {
  await deleteSecretKey(fingerprint);
  await deletePublicKey(fingerprint);
}

export async function keyExists(fingerprint: string) {
  const gpgArgs = ["--list-secret-keys", fingerprint];
  const result = await command.exec("gpg", gpgArgs);

  return result.status;
}
