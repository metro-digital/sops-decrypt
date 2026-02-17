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

import {
  setOutput as coreSetOutput,
  getInput as coreGetInput,
  setFailed as coreSetFailed,
  setSecret as coreSetSecret,
} from "@actions/core";
import type { InputOptions } from "@actions/core";
import fs from "node:fs";
import util from "node:util";
import { gpgImportKey } from "./gpg.js";
import { sopsGetOutputFormat, sopsInstall, sopsDecrypt, type OutputFormat } from "./sops.js";
import yaml from "yaml";

export async function actionRun() {
  try {
    const required: InputOptions = {
      required: true,
    };
    const version = coreGetInput("version", required);
    const gpgKey = coreGetInput("gpg_key", required);
    const encryptedFile = coreGetInput("file", required);
    const outputType = coreGetInput("output_type");
    const outputFormat = sopsGetOutputFormat(outputType);
    const sopsPath = await sopsInstall(version, fs.chmodSync);
    await gpgImportKey(gpgKey);
    let result = await sopsDecrypt(sopsPath, encryptedFile, outputFormat);

    actionHideSecrets(result, outputFormat);
    if (outputFormat === "json") {
      result = JSON.parse(result);
    }

    coreSetOutput("data", result);
  } catch (error: unknown) {
    coreSetFailed(`Failed decrypting the file: ${(error as Error).message}`);
  }
}

function actionHideSecrets(result: string, outputFormat: OutputFormat): void {
  let obj: NodeJS.Dict<string>;

  switch (outputFormat) {
    case "json":
      obj = JSON.parse(result);
      break;
    case "yaml":
      obj = yaml.parse(result);
      break;
    case "dotenv":
      obj = util.parseEnv(result);
      break;
  }

  for (const property in obj) {
    const val = `${obj[property]}`;
    if (val.indexOf("\n") === -1) {
      coreSetSecret(val);
    } else {
      // setSecret does not support multiline strings
      for (const line of val.split("\n")) {
        coreSetSecret(line);
      }
    }
  }
}
