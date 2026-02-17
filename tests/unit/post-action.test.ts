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
import { postActionRun  } from '../../src/post-action'
import { gpgDeleteKey, gpgFingerprint, gpgKeyExists } from '../../src/gpg'

vi.mock('../../src/gpg')
vi.mock('@actions/core', { spy: true})

const mockGPGDelete = vi.mocked(gpgDeleteKey)
const mockFingerprint = vi.mocked(gpgFingerprint)
const mockKeyExists = vi.mocked(gpgKeyExists)

afterEach(() => {
  mockGPGDelete.mockReset()
  mockFingerprint.mockReset()
  mockKeyExists.mockReset()
})

describe('When the post action is triggered', () => {
  describe('when the state variable is set', () => {
    beforeEach(() => {
      process.env.STATE_GPG_KEY = 'key1'
    })
    afterEach(() => {
      delete process.env.STATE_GPG_KEY
    })
    describe('when the runner gpg keyring has the gpg key', () => {
      beforeEach(() => {
        mockKeyExists.mockResolvedValue(true)
      })

      it('should delete the gpg key imported', async () => {
        mockFingerprint.mockResolvedValue('fpr')
        await postActionRun()

        expect(mockGPGDelete).toHaveBeenCalledWith('fpr')
      })
    })
    describe('when the runner gpg keyring does not have the gpg key', () => {
      beforeEach(() => {
        mockKeyExists.mockResolvedValue(false)
      })

      it('should not try to delete the gpg key', async () => {
        mockFingerprint.mockResolvedValue('fpr')
        await postActionRun()

        expect(mockGPGDelete).not.toHaveBeenCalled()
      })
    })
    describe('if an error is occurred', () => {
      describe('while retrieving the fingerprint', () => {
        beforeEach(() => {
          mockFingerprint.mockRejectedValue(new Error('Error message from fingerprint'))
        })

        it('should return the error message', async () => {
          const expectedErrorMsg = 'Error while deleting the gpg key: Error message from fingerprint'

          await expect(postActionRun()).rejects.toThrowError(expectedErrorMsg)
        })
      })

      describe('while deleting the gpg key', () => {
        beforeEach(() => {
          mockKeyExists.mockResolvedValue(true)
          mockGPGDelete.mockRejectedValue(new Error('Error message while deleting the gpg key'))
        })

        it('should return the error message', async () => {
          const expectedErrorMsg = 'Error while deleting the gpg key: Error message while deleting the gpg key'

          await expect(postActionRun()).rejects.toThrowError(expectedErrorMsg)
        })
      })
    })
  })

  describe('when the state variable is not set', () => {
    it('should not get the fingerprint', async () => {
      await postActionRun()

      expect(mockFingerprint).not.toHaveBeenCalled()
    })
  })
})
