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

import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as path from 'path'
import * as command from './command'

const toolName = 'sops'

export enum OutputFormat {
  JSON = 'json',
  YAML = 'yaml',
  DOTENV = 'dotenv'
}

export async function decrypt(sops: string, secret_file: string, output_type: string) : Promise<string> {
  let sopsArgs: string[] = []
  sopsArgs.push('--decrypt')
  sopsArgs.push('--output-type', output_type)
  sopsArgs.push(secret_file)
  core.info(`Decrypting the secrets to ${output_type} format`)
  let result: command.Result = await command.exec(sops, sopsArgs)
  if(!result.status) {
    core.info("Unable to decrypt the secrets")
    return new Promise((resolve,reject) => {
      reject(new Error(`Execution of sops command failed on ${secret_file}: ${result.error}`))
    })
  }

  core.info("Sucessfully decrypted the secrets")
  return new Promise((resolve,reject) => {
    resolve(result.output)
  })
}

export async function install(version: string, chmod: Function) {
  let extension = process.platform === 'win32' ? '.exe' : '';
  let url = downloadURL(version);
  let binaryPath = await download(version, extension, url);
  chmod(binaryPath, '777')
  core.addPath(path.dirname(binaryPath))
  return binaryPath
}

export function downloadURL(version: string) {
  let extension = process.platform === 'win32' ? 'exe' : process.platform;

  return `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.${extension}`
}

export async function download(version: string, extension:string, url: string) {
  let cachedToolpath = toolCache.find(toolName, version);
  if (!cachedToolpath) {
    core.debug(`Downloading ${toolName} from: ${url}`);

    let downloadedToolPath: string;
    try {
      downloadedToolPath = await toolCache.downloadTool(url);
    } catch (error) {
      core.debug(error);
      throw `Failed to download version ${version}: ${error}`;
    }

    cachedToolpath = await toolCache.cacheFile(
      downloadedToolPath,
      toolName + extension,
      toolName,
      version
    );
  }

  const executablePath = path.join(
    cachedToolpath,
    toolName + extension,
  );

  return executablePath
}

export function getOutputFormat(output_type: string): Promise<string> {
  if(Object.values(OutputFormat).includes(output_type as OutputFormat)){
    return new Promise((resolve,reject) => {
      resolve(output_type)
    })
  } else if (!output_type) {
    core.info(`No output_type selected, Defaulting to json`)
    return new Promise((resolve,reject) => {
      resolve(OutputFormat.JSON)
    })
  }

  return new Promise((resolve,reject) => {
    reject(new Error(`Output type "${output_type}" is not supporterd by sops-decrypt`))
  })
}
