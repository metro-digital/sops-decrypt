import * as command from './command'

export async function import_key(base64_gpg_key: string) : Promise<void> {
  let gpg_key: string = Buffer.from(base64_gpg_key, 'base64').toString()
  let gpgArgs: Array<string> = [];
  gpgArgs.push('--import')

  const result: command.Result  = await command.exec('gpg', gpgArgs, gpg_key);
  if(!result.status) {
    return new Promise((resolve,reject) => {
      reject(new Error(`Importing of GPG key failed: ${result.error}`))
    })
  }

  return new Promise((resolve,reject) => {
    resolve()
  })
}

export async function get_fingerprint(base64_gpg_key: string) : Promise<string> {
  let gpg_key: string = Buffer.from(base64_gpg_key, 'base64').toString()
  let gpgArgs: Array<string> = [];
  gpgArgs.push('--with-colons')
  gpgArgs.push('--import-options', 'show-only')
  gpgArgs.push('--import')
  gpgArgs.push('--fingerprint')
  const gpgResult: command.Result  = await command.exec('gpg', gpgArgs, gpg_key);
  if(!gpgResult.status) {
    return new Promise((resolve,reject) => {
      reject(new Error(`Unable to get the fingerprint of the gpg key: ${gpgResult.error}`))
    })
  }

  let fingerprints = gpgResult.output
  let matchingString = "fpr"
  let fingerprint: string = fingerprints.slice(fingerprints.indexOf(matchingString) + matchingString.length).split("\n")[0];
  fingerprint = fingerprint.replace(/[^a-zA-Z0-9]/g,'');
  return new Promise((resolve,reject) => {
    resolve(fingerprint)
  })
}

export async function delete_secret_key(fingerprint: string) : Promise<void> {
  let gpgArgs: Array<string> = [];
  gpgArgs.push('--batch')
  gpgArgs.push('--yes')
  gpgArgs.push('--delete-secret-keys')
  gpgArgs.push(fingerprint)

  const result: command.Result  = await command.exec('gpg', gpgArgs);
  if(!result.status) {
    return new Promise((resolve,reject) => {
      reject(new Error(`Deleting private GPG key failed: ${result.error}`))
    })
  }

  return new Promise((resolve,reject) => {
    resolve()
  })
}

export async function delete_public_key(fingerprint: string) : Promise<void> {
  let gpgArgs: Array<string> = [];
  gpgArgs.push('--batch')
  gpgArgs.push('--yes')
  gpgArgs.push('--delete-keys')
  gpgArgs.push(fingerprint)

  const result: command.Result  = await command.exec('gpg', gpgArgs);
  if(!result.status) {
    return new Promise((resolve,reject) => {
      reject(new Error(`Deleting gpg public key failed: ${result.error}`))
    })
  }

  return new Promise((resolve,reject) => {
    resolve()
  })
}

export async function delete_key(fingerprint: string) : Promise<any> {
  await delete_secret_key(fingerprint)
  await delete_public_key(fingerprint)
}

export async function key_exists(fingerprint: string): Promise<boolean> {
  let gpgArgs: Array<string> = [];
  gpgArgs.push('--list-secret-keys', fingerprint)
  const result: command.Result  = await command.exec('gpg', gpgArgs);

  return result.status
}
