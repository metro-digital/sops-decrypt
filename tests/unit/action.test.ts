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

import * as fs from 'fs'
import { mocked } from 'jest-mock'
import * as core from '@actions/core'
import * as action from '../../src/action'
import * as gpg from '../../src/gpg'
import * as sops from '../../src/sops'

jest.mock('../../src/sops')
jest.mock('../../src/gpg')

let mockGPGImport: jest.MockedFunction<typeof gpg.importKey>
let mockGPGDelete: jest.MockedFunction<typeof gpg.deleteKey>
let mockSOPSDecrypt: jest.MockedFunction<typeof sops.decrypt>
let mockSOPSInstall: jest.MockedFunction<typeof sops.install>
let mockSOPSOutputFormat: jest.MockedFunction<typeof sops.getOutputFormat>

jest.spyOn(core, 'setOutput').mockImplementation(jest.fn())
const mockCoreSetFailed = jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
jest.spyOn(core, 'info').mockImplementation(jest.fn())
jest.spyOn(core, 'saveState').mockImplementation(jest.fn())
const mockCoreSetSecret = jest.spyOn(core, 'setSecret').mockImplementation(jest.fn())

beforeEach(() => {
  mockGPGImport = mocked(gpg.importKey)
  mockGPGDelete = mocked(gpg.deleteKey)
  mockSOPSDecrypt = mocked(sops.decrypt)
  mockSOPSInstall = mocked(sops.install).mockResolvedValue('sops')
  mockSOPSOutputFormat = mocked(sops.getOutputFormat)
})

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
      mockSOPSDecrypt.mockReturnValue(new Promise((resolve) => {
        resolve(JSON.stringify({
          sample: 'data'
        }))
      }))
    })

    afterEach(() => {
      delete process.env.INPUT_VERSION
      delete process.env.INPUT_FILE
      delete process.env.INPUT_GPG_KEY
      delete process.env.INPUT_OUTPUT_TYPE
    })

    it('should install sops with version passed', async () => {
      await action.run()

      expect(mockSOPSInstall).toHaveBeenCalledWith('goodVersion', fs.chmodSync)
    })

    it('should import the gpg key passed', async () => {
      await action.run()

      expect(mockGPGImport).toHaveBeenCalledWith(gpgKey)
    })

    it('should decrypt the secret file passed', async () => {
      mockSOPSInstall.mockResolvedValue('path/to/sops/binary')
      mockSOPSOutputFormat.mockReturnValue(sops.OutputFormat.JSON)
      await action.run()

      expect(mockSOPSDecrypt).toHaveBeenCalledWith('path/to/sops/binary', encryptedFile, 'json')
      expect(mockCoreSetSecret).toHaveBeenCalledTimes(1)
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

      await action.run()

      expect(mockCoreSetFailed).toHaveBeenCalledWith(expectedErrorMsg)
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

        await action.run()

        expect(mockCoreSetFailed).toBeCalledWith(expectedErrorMsg)
      })
    })

    describe('while importing a gpg key', () => {
      beforeEach(() => {
        mockGPGImport.mockReturnValue(new Promise((resolve, reject) => {
          reject(new Error('Error message from gpg'))
        }))
      })

      it('should return the error message', async () => {
        const expectedErrorMsg = 'Failed decrypting the file: Error message from gpg'

        await action.run()

        expect(mockCoreSetFailed).toBeCalledWith(expectedErrorMsg)
      })
    })

    describe('while decrypting a secret file', () => {
      beforeEach(() => {
        mockSOPSDecrypt.mockReturnValue(new Promise((resolve, reject) => {
          reject(new Error('Error message from sops'))
        }))
      })

      it('should return the error message', async () => {
        const expectedErrorMsg = 'Failed decrypting the file: Error message from sops'

        await action.run()

        expect(mockCoreSetFailed).toBeCalledWith(expectedErrorMsg)
      })
    })
  })
})
