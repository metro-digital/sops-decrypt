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
import { InputOptions } from '@actions/core'
import * as fs from 'fs'
import * as gpg from './gpg'
import * as sops from './sops'

export async function run() {
  try {
    const required: InputOptions = {
      required: true
    }
    const version: string = core.getInput('version', required)
    const gpg_key: string = core.getInput('gpg_key', required)
    const encrypted_file: string = core.getInput('file', required)
    const output_type: string = core.getInput('output_type')
    let outputFormat = await sops.getOutputFormat(output_type)
    let sopsPath = await sops.install(version, fs.chmodSync)
    await gpg.import_key(gpg_key)
    let result: string = await sops.decrypt(sopsPath, encrypted_file, outputFormat)
    if (outputFormat === sops.OutputFormat.JSON) {
      result = JSON.parse(result)
    }

    core.setOutput('data', result)
  }
  catch(error) {
    core.setFailed(`Failed decrypting the file: ${error.message}`)
  }
}
