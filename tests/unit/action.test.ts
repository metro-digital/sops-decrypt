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
import fs from 'fs'

import { setFailed as coreSetFailed, setSecret as coreSetSecret } from '@actions/core'
import { actionRun } from '../../src/action'
import { gpgImportKey, gpgDeleteKey} from '../../src/gpg'
import { sopsDecrypt, sopsInstall, sopsGetOutputFormat } from '../../src/sops'

vi.mock('@actions/core', { spy: true})
vi.mock('../../src/sops')
vi.mock('../../src/gpg')

const mockGPGImport = vi.mocked(gpgImportKey)
const mockGPGDelete = vi.mocked(gpgDeleteKey)
const mockSOPSDecrypt = vi.mocked(sopsDecrypt)
const mockSOPSInstall = vi.mocked(sopsInstall).mockResolvedValue('sops')
const mockSOPSOutputFormat = vi.mocked(sopsGetOutputFormat)

afterEach(() => {
  mockGPGImport.mockReset()
  mockGPGDelete.mockReset()
  mockSOPSDecrypt.mockReset()
  mockSOPSInstall.mockReset()
  mockSOPSOutputFormat.mockReset()
})

describe('When the action is triggered', () => {
  const encryptedFile = 'encrypted/file1'
  const gpgKey = 'key1'
  describe('by passing the required variables', () => {
    beforeEach(() => {
      process.env.INPUT_VERSION = 'goodVersion'
      process.env.INPUT_FILE = encryptedFile
      process.env.INPUT_GPG_KEY = gpgKey
      process.env.INPUT_OUTPUT_TYPE = 'json'
      mockSOPSDecrypt.mockResolvedValue(JSON.stringify({ sample: 'data' }))
    })

    afterEach(() => {
      delete process.env.INPUT_VERSION
      delete process.env.INPUT_FILE
      delete process.env.INPUT_GPG_KEY
      delete process.env.INPUT_OUTPUT_TYPE
    })

    it('should install sops with version passed', async () => {
      await actionRun()

      expect(mockSOPSInstall).toHaveBeenCalledWith('goodVersion', fs.chmodSync)
    })

    it('should import the gpg key passed', async () => {
      await actionRun()

      expect(mockGPGImport).toHaveBeenCalledWith(gpgKey)
    })

    it('should decrypt the secret file passed', async () => {
      mockSOPSInstall.mockResolvedValue('path/to/sops/binary')
      mockSOPSOutputFormat.mockReturnValue("json")
      await actionRun()

      expect(mockSOPSDecrypt).toHaveBeenCalledWith('path/to/sops/binary', encryptedFile, 'json')
      expect(coreSetSecret).toHaveBeenCalledTimes(1)
    })
  })

  describe('without passing a required key', () => {
    beforeEach(() => {
      process.env.INPUT_VERSION = 'goodVersion'
      process.env.INPUT_FILE = encryptedFile
    })

    afterEach(() => {
      delete process.env.INPUT_VERSION
      delete process.env.INPUT_FILE
    })

    it('should throw an error', async () => {
      const expectedErrorMsg = 'Failed decrypting the file: Input required and not supplied: gpg_key'

      await actionRun()

      expect(coreSetFailed).toHaveBeenCalledWith(expectedErrorMsg)
    })
  })

  describe('if an error is occurred', () => {
    beforeEach(() => {
      process.env.INPUT_VERSION = 'goodVersion'
      process.env.INPUT_FILE = encryptedFile
      process.env.INPUT_GPG_KEY = gpgKey
    })

    afterEach(() => {
      delete process.env.INPUT_VERSION
      delete process.env.INPUT_FILE
      delete process.env.INPUT_GPG_KEY
    })

    describe('while getting the output format of sops', () => {
      beforeEach(() => {
        mockSOPSOutputFormat.mockImplementation(() => { throw new Error('Error message from getOutputFormat') })
      })

      it('should return the error message', async () => {
        const expectedErrorMsg = 'Failed decrypting the file: Error message from getOutputFormat'

        await actionRun()

        expect(coreSetFailed).toBeCalledWith(expectedErrorMsg)
      })
    })

    describe('while importing a gpg key', () => {
      beforeEach(() => {
        mockGPGImport.mockRejectedValue(new Error('Error message from gpg'))
      })

      it('should return the error message', async () => {
        const expectedErrorMsg = 'Failed decrypting the file: Error message from gpg'

        await actionRun()

        expect(coreSetFailed).toBeCalledWith(expectedErrorMsg)
      })
    })

    describe('while decrypting a secret file', () => {
      beforeEach(() => {
        mockSOPSDecrypt.mockRejectedValue(new Error('Error message from sops'))
      })

      it('should return the error message', async () => {
        const expectedErrorMsg = 'Failed decrypting the file: Error message from sops'

        await actionRun()

        expect(coreSetFailed).toBeCalledWith(expectedErrorMsg)
      })
    })
  })
})
