import * as core from '@actions/core'
import { InputOptions } from '@actions/core'
import * as fs from 'fs'
import * as gpg from './gpg'
import * as sops from './sops'

export async function run() {
  const required: InputOptions = {
    required: true
  }
  const version: string = core.getInput('version', required)
  const gpg_key: string = core.getInput('gpg_key', required)
  const encrypted_file: string = core.getInput('file', required)
  const output_type: string = core.getInput('output_type')
  try {
    let outputFormat = await sops.getOutputFormat(output_type)
    let sopsPath = await sops.install(version, fs.chmodSync)
    await gpg.import_key(gpg_key)
    let result: string = await sops.decrypt(sopsPath, encrypted_file, outputFormat)
    if (outputFormat === sops.OutputFormat.JSON) {
      result = JSON.parse(result)
    }

    core.setOutput('data', result)
  }
  catch(e) {
    core.setFailed(`Error occured while executing the action ${e.message}`)
    throw new Error(`Failed decrypting the secret file: ${e.message}`)
  }
}

run().catch((e) => {core.setFailed(e.message)});
