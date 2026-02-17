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

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { gpgImportKey, gpgDeleteKey, gpgKeyExists, gpgFingerprint } from '../../src/gpg'
import {
  gpg_fixture_base64_private_key1,
  gpg_fixture_private_key1_fpr
} from '../fixtures/gpg_private_keys'

vi.mock('@actions/core', { spy: true})

describe('When deleting the gpg key', () => {
  beforeEach(async () => {
    await gpgImportKey(gpg_fixture_base64_private_key1)
  })

  it('should be able to get the fingerprint of the key passed', async () => {
    const expectedFPR = gpg_fixture_private_key1_fpr
    const actualFPR = await gpgFingerprint(gpg_fixture_base64_private_key1)

    expect(actualFPR).toEqual(expectedFPR)
  })

  it('should delete the key without an error', async () => {
    await expect(gpgDeleteKey(gpg_fixture_private_key1_fpr)).resolves.not.toThrow()
  })
})

describe('When checking for the existence of the gpg key', () => {
  describe('when gpg key exists', () => {
    beforeEach(async () => {
      await gpgImportKey(gpg_fixture_base64_private_key1)
    })

    afterEach(async () => {
      await (gpgDeleteKey(gpg_fixture_private_key1_fpr))
    })

    it('should return true ', async () => {
      const actual = await gpgKeyExists(gpg_fixture_private_key1_fpr)

      expect(actual).toBeTruthy()
    })
  })

  describe('when gpg key does not exist', () => {
    it('should return false', async () => {
      const actual = await gpgKeyExists(gpg_fixture_private_key1_fpr)

      expect(actual).not.toBeTruthy()
    })
  })
})
