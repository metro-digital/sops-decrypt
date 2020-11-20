import * as fs from 'fs'
import * as gpg from './gpg'
import * as sops from './sops'

export async function run() {
  await sops.install('3.6.1', fs.chmodSync)
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
