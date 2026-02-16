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
import type { InputOptions } from "@actions/core";
import * as fs from "node:fs";
import * as gpg from "./gpg";
import * as sops from "./sops";
import * as envfile from "envfile";
import * as yaml from "yaml";

export async function run() {
  try {
    const required: InputOptions = {
      required: true,
    };
    const version = core.getInput("version", required);
    const gpgKey = core.getInput("gpg_key", required);
    const encryptedFile = core.getInput("file", required);
    const outputType = core.getInput("output_type");
    const outputFormat = sops.getOutputFormat(outputType);
    const sopsPath = await sops.install(version, fs.chmodSync);
    await gpg.importKey(gpgKey);
    let result = await sops.decrypt(sopsPath, encryptedFile, outputFormat);

    hideSecrets(result, outputFormat);
    if (outputFormat === "json") {
      result = JSON.parse(result);
    }

    core.setOutput("data", result);
  } catch (error: unknown) {
    core.setFailed(`Failed decrypting the file: ${(error as Error).message}`);
  }
}

function hideSecrets(result: string, outputFormat: sops.OutputFormat): void {
  let obj: { [key: string]: string };

  switch (outputFormat) {
    case "json":
      obj = JSON.parse(result);
      break;
    case "yaml":
      obj = yaml.parse(result);
      break;
    case "dotenv":
      obj = envfile.parse(result);
      break;
  }

  for (const property in obj) {
    const val = `${obj[property]}`;
    if (val.indexOf("\n") === -1) {
      core.setSecret(val);
    } else {
      // setSecret does not support multiline strings
      for (const line of val.split("\n")) {
        core.setSecret(line);
      }
    }
  }
}
