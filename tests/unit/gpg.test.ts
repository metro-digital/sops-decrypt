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

import * as gpg from '../../src/gpg'
import * as core from '@actions/core';
import * as command from '../../src/command'
import { mocked } from 'ts-jest/utils';

jest.mock('../../src/command')
jest.spyOn(core, 'setOutput').mockImplementation(jest.fn())
jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
jest.spyOn(core, 'info').mockImplementation(jest.fn())
jest.spyOn(core, 'saveState').mockImplementation(jest.fn())

let mockExec: jest.Mock

beforeEach(()=>{
  mockExec = mocked(command.exec, true)
})

afterEach(()=>{
  mockExec.mockReset()
})

describe('When importing of a gpg key',()=>{
  describe('is successful', ()=>{
    beforeEach(()=>{
      mockExec.mockReturnValue({
        status: true,
        output: 'imported',
        error: 'Unable to imort the gpg key'
      } as command.Result)
    })

    it('should pass the right arguments', async ()=>{
      let expectedArgs: string[] = [];
      expectedArgs.push('--import')

      await gpg.import_key(base64Encode('sample_gpg_key'))

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs, 'sample_gpg_key')
    })

    it('should not throw an error', async ()=>{
      await expect(gpg.import_key(base64Encode('sample_gpg_key'))).resolves.not.toThrow();
    })
  })

  describe('is a failure', ()=>{
    beforeEach(()=>{
      mockExec.mockReturnValue({
        status: false,
        output: 'imported',
        error: 'Error message from gpg'
      } as command.Result)
    })

    it('should throw an error', async ()=>{
      await expect(gpg.import_key(base64Encode('sample_gpg_key'))).rejects.toThrow();
    })

    it('should throw the error returned by the command', async ()=>{
      let expectedErrorMsg = 'Importing of GPG key failed: Error message from gpg'
      await expect(gpg.import_key(base64Encode('sample_gpg_key'))).rejects.toThrowError(expectedErrorMsg);
    })
  })
})

describe('When getting fingerprint of a gpg key',()=>{
  describe('is successful', ()=>{
    beforeEach(()=>{
      mockExec.mockReturnValue({
        status: true,
        output: 'sample_fpr',
        error: ''
      } as command.Result)
    })

    it('should pass the right arguments', async ()=>{
      let expectedArgs: string[] = [];
      expectedArgs.push('--with-colons')
      expectedArgs.push('--import-options', 'show-only')
      expectedArgs.push('--import')
      expectedArgs.push('--fingerprint')

      await gpg.fingerprint(base64Encode('sample_gpg_key'))

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs, 'sample_gpg_key')
    })

    it('should not throw an error', async ()=>{
      await expect(gpg.fingerprint(base64Encode('sample_gpg_key'))).resolves.not.toThrow();
    })
  })
})

describe('When deleting the secret gpg key',()=>{
  describe('is successful', ()=>{
    beforeEach(()=>{
      mockExec.mockReturnValue({
        status: true,
        output: '',
        error: ''
      } as command.Result)
    })

    it('should pass the right arguments', async ()=>{
      let expectedArgs: string[] = [];
      expectedArgs.push('--batch')
      expectedArgs.push('--yes')
      expectedArgs.push('--delete-secret-keys')
      expectedArgs.push('sample_fpr')

      await gpg.delete_secret_key('sample_fpr')

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs)
    })

    it('should not throw an error', async ()=>{
      await expect(gpg.delete_secret_key('sample_fpr')).resolves.not.toThrow();
    })
  })
})

describe('When deleting the public gpg key',()=>{
  describe('is successful', ()=>{
    beforeEach(()=>{
      mockExec.mockReturnValue({
        status: true,
        output: '',
        error: ''
      } as command.Result)
    })

    it('should pass the right arguments', async ()=>{
      let expectedArgs: string[] = [];
      expectedArgs.push('--batch')
      expectedArgs.push('--yes')
      expectedArgs.push('--delete-keys')
      expectedArgs.push('sample_fpr')

      await gpg.delete_public_key('sample_fpr')

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs)
    })

    it('should not throw an error', async ()=>{
      await expect(gpg.delete_public_key('sample_fpr')).resolves.not.toThrow();
    })
  })
})

function base64Encode(key: string) {
  return Buffer.from(key).toString('base64')
}
