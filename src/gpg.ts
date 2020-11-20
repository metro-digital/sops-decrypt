import * as command from './command'
export async function import_key(base64_gpg_key: string) {
  let gpg_key: string = atob(base64_gpg_key)
  let gpgArgs: Array<string> = [];
  gpgArgs.push('--import')
  let result: command.Result  = await command.exec('gpg', gpgArgs, gpg_key);
  if(!result.status) {
    throw new Error(`Importing of GPG key failed: ${result.error}`);
  }
}
