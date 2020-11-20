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
