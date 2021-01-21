import * as core from '@actions/core'
import { InputOptions } from '@actions/core'
import * as fs from 'fs'
import * as gpg from './gpg'
import * as sops from './sops'
import * as command from './command'

export async function run() {
  const required: InputOptions = {
    required: true
  }
  const version: string = core.getInput('version', required)
  const gpg_key: string = core.getInput('gpg_key', required)
  const encrypted_file: string = core.getInput('file', required)
  const output_type: string = core.getInput('output_type')
  try {
    let format = 'json'
    if(output_type !== '') {
      format = output_type
    }

    let sopsPath = await sops.install(version, fs.chmodSync)
    core.info('Importing the gpg key')
    await gpg.import_key(gpg_key)
    core.saveState("GPG_KEY", gpg_key)
    core.info('Imported the gpg key')
    core.info('Decrypting the secrets')
    core.info(`Selected output format: ${format}`)
    let result: command.Result = await sops.decrypt(sopsPath, encrypted_file, format)
    let output: any = result.output
    if (result.status) {
      core.info('Successfully decrypted the secrets')
      if (format === 'json') {
        output = JSON.parse(result.output)
      }

      core.setOutput('data', output)
    }
  }
  catch(e) {
    core.setFailed(`Error occured while executing the action ${e.message}`)
    throw new Error(`Failed decrypting the secret file: ${e.message}`)
  }
}

run().catch((e) => {core.setFailed(e.message)});
