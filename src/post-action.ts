import * as core from '@actions/core'
import * as gpg from './gpg'

export async function run() {
  const gpg_key = (process.env['STATE_GPG_KEY'] as string) || ''
  try {
    core.info('Deleting the imported gpg key')
    await gpg.delete_key(gpg_key)
    core.info('Successfully deleted the imported gpg key')
  }
  catch(e) {
    core.setFailed(`Error while deleting the gpg key ${e.message}`)
  }
}

run().catch((e) => {core.setFailed(e.message)});
