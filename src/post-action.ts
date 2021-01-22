import * as core from '@actions/core'
import * as gpg from './gpg'

export async function run() {
  const gpg_key = (process.env['STATE_GPG_KEY'] as string) || ''
  try {
    core.info('Getting the fingerprint')
    let fingerprint = await gpg.get_fingerprint(gpg_key)
    core.info('Got the fingerprint')
    if (await gpg.key_exists(fingerprint)) {
      core.info('Deleting the imported gpg key')
      await gpg.delete_key(fingerprint)
      core.info('Successfully deleted the imported gpg key')
    } else {
      core.info('GPG key does not exist')
    }
  }
  catch(e) {
    core.setFailed(`Error while deleting the gpg key ${e.message}`)
  }
}

run().catch((e) => {core.setFailed(e.message)});
