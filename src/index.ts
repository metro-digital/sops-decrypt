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
    await sops.install(version, fs.chmodSync)
    await gpg.import_key(gpg_key)
    await sops.decrypt(encrypted_file)
  }
  catch(e) {
    throw new Error(`Failed decrypting the secret file: ${e.message}`)
  }
}
