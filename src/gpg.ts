/*
 * Copyright 2021 METRO Digital GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as command from './command'
import * as core from '@actions/core'

export async function importKey (base64GPGKey: string) : Promise<void> {
  const gpgKey: string = Buffer.from(base64GPGKey, 'base64').toString()
  const gpgArgs: Array<string> = []
  gpgArgs.push('--import')

  core.info('Importing the gpg key')
  const result: command.Result = await command.exec('gpg', gpgArgs, gpgKey)
  if (!result.status) {
    core.info('Failed importing the GPG key')
    return new Promise((resolve, reject) => {
      reject(new Error(`Importing of GPG key failed: ${result.error}`))
    })
  }

  core.info('Successfully imported the gpg key')
  core.saveState('GPG_KEY', base64GPGKey)
  return new Promise((resolve) => {
    resolve()
  })
}

export async function fingerprint (base64GPGKey: string) : Promise<string> {
  const gpgKey: string = Buffer.from(base64GPGKey, 'base64').toString()
  const gpgArgs: Array<string> = []
  gpgArgs.push('--with-colons')
  gpgArgs.push('--import-options', 'show-only')
  gpgArgs.push('--import')
  gpgArgs.push('--fingerprint')
  const gpgResult: command.Result = await command.exec('gpg', gpgArgs, gpgKey)
  if (!gpgResult.status) {
    return new Promise((resolve, reject) => {
      reject(new Error(`Unable to get the fingerprint of the gpg key: ${gpgResult.error}`))
    })
  }

  const fingerprints = gpgResult.output
  const matchingString = 'fpr'
  let fingerprint: string = fingerprints.slice(fingerprints.indexOf(matchingString) + matchingString.length).split('\n')[0]
  fingerprint = fingerprint.replace(/[^a-zA-Z0-9]/g, '')
  return new Promise((resolve) => {
    resolve(fingerprint)
  })
}

export async function deleteSecretKey (fingerprint: string) : Promise<void> {
  const gpgArgs: Array<string> = []
  gpgArgs.push('--batch')
  gpgArgs.push('--yes')
  gpgArgs.push('--delete-secret-keys')
  gpgArgs.push(fingerprint)

  const result: command.Result = await command.exec('gpg', gpgArgs)
  if (!result.status) {
    return new Promise((resolve, reject) => {
      reject(new Error(`Deleting private GPG key failed: ${result.error}`))
    })
  }

  return new Promise((resolve) => {
    resolve()
  })
}

export async function deletePublicKey (fingerprint: string) : Promise<void> {
  const gpgArgs: Array<string> = []
  gpgArgs.push('--batch')
  gpgArgs.push('--yes')
  gpgArgs.push('--delete-keys')
  gpgArgs.push(fingerprint)

  const result: command.Result = await command.exec('gpg', gpgArgs)
  if (!result.status) {
    return new Promise((resolve, reject) => {
      reject(new Error(`Deleting gpg public key failed: ${result.error}`))
    })
  }

  return new Promise((resolve) => {
    resolve()
  })
}

export async function deleteKey (fingerprint: string) : Promise<void> {
  await deleteSecretKey(fingerprint)
  await deletePublicKey(fingerprint)
}

export async function keyExists (fingerprint: string): Promise<boolean> {
  const gpgArgs: Array<string> = []
  gpgArgs.push('--list-secret-keys', fingerprint)
  const result: command.Result = await command.exec('gpg', gpgArgs)

  return result.status
}
