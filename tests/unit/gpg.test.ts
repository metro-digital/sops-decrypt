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

import { describe, expect, it, vi, beforeEach, afterEach, MockedFunction } from 'vitest'
import * as gpg from '../../src/gpg'
import * as core from '@actions/core'
import * as command from '../../src/command'

vi.mock('../../src/command')
vi.spyOn(core, 'setOutput').mockImplementation(vi.fn())
vi.spyOn(core, 'setFailed').mockImplementation(vi.fn())
vi.spyOn(core, 'info').mockImplementation(vi.fn())
vi.spyOn(core, 'saveState').mockImplementation(vi.fn())

let mockExec: MockedFunction<typeof command.exec>

beforeEach(() => {
  mockExec = vi.mocked(command.exec)
})

afterEach(() => {
  mockExec.mockReset()
})

describe('When importing of a gpg key', () => {
  describe('is successful', () => {
    beforeEach(() => {
      mockExec.mockResolvedValue({
        status: true,
        output: 'imported',
        error: 'Unable to import the gpg key'
      })
    })

    it('should pass the right arguments', async () => {
      const expectedArgs: string[] = []
      expectedArgs.push('--import')

      await gpg.importKey(base64Encode('sample_gpg_key'))

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs, 'sample_gpg_key')
    })

    it('should not throw an error', async () => {
      await expect(gpg.importKey(base64Encode('sample_gpg_key'))).resolves.not.toThrow()
    })
  })

  describe('is a failure', () => {
    beforeEach(() => {
      mockExec.mockResolvedValue({
        status: false,
        output: 'imported',
        error: 'Error message from gpg'
      })
    })

    it('should throw an error', async () => {
      await expect(gpg.importKey(base64Encode('sample_gpg_key'))).rejects.toThrow()
    })

    it('should throw the error returned by the command', async () => {
      const expectedErrorMsg = 'Importing of GPG key failed: Error message from gpg'
      await expect(gpg.importKey(base64Encode('sample_gpg_key'))).rejects.toThrowError(expectedErrorMsg)
    })
  })
})

describe('When getting fingerprint of a gpg key', () => {
  describe('is successful', () => {
    beforeEach(() => {
      mockExec.mockResolvedValue({
        status: true,
        output: 'sample_fpr',
        error: ''
      })
    })

    it('should pass the right arguments', async () => {
      const expectedArgs: string[] = []
      expectedArgs.push('--with-colons')
      expectedArgs.push('--import-options', 'show-only')
      expectedArgs.push('--import')
      expectedArgs.push('--fingerprint')

      await gpg.fingerprint(base64Encode('sample_gpg_key'))

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs, 'sample_gpg_key')
    })

    it('should not throw an error', async () => {
      await expect(gpg.fingerprint(base64Encode('sample_gpg_key'))).resolves.not.toThrow()
    })
  })
})

describe('When deleting the secret gpg key', () => {
  describe('is successful', () => {
    beforeEach(() => {
      mockExec.mockResolvedValue({
        status: true,
        output: '',
        error: ''
      })
    })

    it('should pass the right arguments', async () => {
      const expectedArgs: string[] = []
      expectedArgs.push('--batch')
      expectedArgs.push('--yes')
      expectedArgs.push('--delete-secret-keys')
      expectedArgs.push('sample_fpr')

      await gpg.deleteSecretKey('sample_fpr')

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs)
    })

    it('should not throw an error', async () => {
      await expect(gpg.deleteSecretKey('sample_fpr')).resolves.not.toThrow()
    })
  })
})

describe('When deleting the public gpg key', () => {
  describe('is successful', () => {
    beforeEach(() => {
      mockExec.mockResolvedValue({
        status: true,
        output: '',
        error: ''
      })
    })

    it('should pass the right arguments', async () => {
      const expectedArgs: string[] = []
      expectedArgs.push('--batch')
      expectedArgs.push('--yes')
      expectedArgs.push('--delete-keys')
      expectedArgs.push('sample_fpr')

      await gpg.deletePublicKey('sample_fpr')

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs)
    })

    it('should not throw an error', async () => {
      await expect(gpg.deletePublicKey('sample_fpr')).resolves.not.toThrow()
    })
  })
})

function base64Encode (key: string) {
  return Buffer.from(key).toString('base64')
}
