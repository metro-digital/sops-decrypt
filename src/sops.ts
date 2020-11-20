import * as command from './command'

export async function decrypt(secret_file: string) : Promise<any> {
  let sopsArgs: string[] = []
  sopsArgs.push('--decrypt')
  sopsArgs.push('--output-type', 'json')
  sopsArgs.push(secret_file)
  let result: command.Result = await command.exec('sops', sopsArgs)
  if(!result.status) {
    return new Promise((resolve,reject) => {
      reject(new Error(`Execution of sops command failed: ${result.error}`))
    })
  }

  return new Promise((resolve,reject) => {
    resolve()
  })
}
