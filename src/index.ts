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
  await sops.install(version, fs.chmodSync)
}

export async function decrypt(base64_gpgKey: string, secret_file: string) {
  try {
    await gpg.import_key(base64_gpgKey)
    await sops.decrypt(secret_file)
  }
  catch(e) {
    throw new Error(`Failed decrypting the secret file: ${e.message}`)
  }
}
