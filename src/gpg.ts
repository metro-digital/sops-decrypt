import * as command from './command'

export async function import_key(base64_gpg_key: string) : Promise<any> {
  let gpg_key: string = atob(base64_gpg_key)
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

export async function fingerprint(base64_gpg_key: string) : Promise<string> {
  let gpg_key: string = atob(base64_gpg_key)
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
  let fingerprint = fingerprints.slice(fingerprints.indexOf(matchingString) + matchingString.length).split("\n")[0];
  let fpr = fingerprint.replace(/[^a-zA-Z0-9]/g,'');
  return new Promise((resolve,reject) => {
    resolve(fpr)
  })
}
