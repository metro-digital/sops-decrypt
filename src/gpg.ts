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

export async function importKey (base64GPGKey: string) {
  const gpgKey = Buffer.from(base64GPGKey, 'base64').toString()
  const gpgArgs = [
    '--import'
  ]

  core.info('Importing the gpg key')
  const result = await command.exec('gpg', gpgArgs, gpgKey)
  if (!result.status) {
    core.info('Failed importing the GPG key')
    throw new Error(`Importing of GPG key failed: ${result.error}`)
  }

  core.info('Successfully imported the gpg key')
  core.saveState('GPG_KEY', base64GPGKey)
}

export async function fingerprint (base64GPGKey: string) {
  const gpgKey: string = Buffer.from(base64GPGKey, 'base64').toString()
  const gpgArgs = [
    '--with-colons',
    '--import-options',
    'show-only',
    '--import',
    '--fingerprint'
  ]

  const gpgResult = await command.exec('gpg', gpgArgs, gpgKey)
  if (!gpgResult.status) {
    throw new Error(`Unable to get the fingerprint of the gpg key: ${gpgResult.error}`)
  }

  const fingerprints = gpgResult.output
  let fingerprint = fingerprints.slice(fingerprints.indexOf('fpr') + 3).split('\n')[0]
  fingerprint = fingerprint.replace(/[^a-zA-Z0-9]/g, '')
  return fingerprint
}

export async function deleteSecretKey (fingerprint: string) {
  const gpgArgs = [
    '--batch',
    '--yes',
    '--delete-secret-keys',
    fingerprint
  ]

  const result = await command.exec('gpg', gpgArgs)
  if (!result.status) {
    throw new Error(`Deleting private GPG key failed: ${result.error}`)
  }
}

export async function deletePublicKey (fingerprint: string) {
  const gpgArgs = [
    '--batch',
    '--yes',
    '--delete-keys',
    fingerprint
  ]

  const result = await command.exec('gpg', gpgArgs)
  if (!result.status) {
    throw new Error(`Deleting gpg public key failed: ${result.error}`)
  }
}

export async function deleteKey (fingerprint: string) {
  await deleteSecretKey(fingerprint)
  await deletePublicKey(fingerprint)
}

export async function keyExists (fingerprint: string) {
  const gpgArgs = [
    '--list-secret-keys',
    fingerprint
  ]
  const result = await command.exec('gpg', gpgArgs)

  return result.status
}
