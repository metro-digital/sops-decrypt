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
  try {
    let sopsPath = await sops.install(version, fs.chmodSync)
    core.info('Importing the gpg key')
    await gpg.import_key(gpg_key)
    core.saveState("GPG_KEY", gpg_key)
    core.info('Imported the gpg key')
    core.info('Decrypting the secrets')
    let result: command.Result = await sops.decrypt(sopsPath, encrypted_file)
    if (result.status) {
      core.info('Successfully decrypted the secrets')
      core.setOutput('data', JSON.parse(result.output))
    }
  }
  catch(e) {
    core.setFailed(`Error occured while executing the action ${e.message}`)
    throw new Error(`Failed decrypting the secret file: ${e.message}`)
  }
}

run().catch((e) => {core.setFailed(e.message)});
