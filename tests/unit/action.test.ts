import * as fs from 'fs'
import { mocked } from 'ts-jest/utils';
import * as core from '@actions/core';
import * as action from '../../src/action';
import * as gpg from '../../src/gpg';
import * as sops from '../../src/sops';

jest.mock('../../src/sops')
jest.mock('../../src/gpg')

let mockGPGImport: jest.Mock
let mockGPGDelete: jest.Mock
let mockSOPSDecrypt: jest.Mock
let mockSOPSInstall: jest.Mock
let mockSOPSOutputFormat: jest.Mock

jest.spyOn(core, 'setOutput').mockImplementation(jest.fn())
let mockCoreSetFaild = jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
jest.spyOn(core, 'info').mockImplementation(jest.fn())
jest.spyOn(core, 'saveState').mockImplementation(jest.fn())

beforeEach(()=>{
  mockGPGImport = mocked(gpg.import_key, true)
  mockGPGDelete = mocked(gpg.delete_key, true)
  mockSOPSDecrypt = mocked(sops.decrypt, true)
  mockSOPSInstall = mocked(sops.install, true).mockResolvedValue('sops')
  mockSOPSOutputFormat = mocked(sops.getOutputFormat, true)
})

afterEach(()=>{
  mockGPGImport.mockReset()
  mockGPGDelete.mockReset()
  mockSOPSDecrypt.mockReset()
  mockSOPSInstall.mockReset()
  mockSOPSOutputFormat.mockReset()
})

describe('When the action is triggered', ()=>{
  const encrypted_file = 'encrypted/file1'
  const gpg_key = 'key1'
  describe('by passing the required variables', ()=>{
    beforeEach(()=>{
      process.env['INPUT_VERSION'] = 'goodVersion';
      process.env['INPUT_FILE'] = encrypted_file;
      process.env['INPUT_GPG_KEY'] = gpg_key;
      process.env['INPUT_OUTPUT_TYPE'] = 'json';
      mockSOPSDecrypt.mockReturnValue(new Promise((resolve,reject) => {
        resolve(JSON.stringify({
            sample: "data"
          }))
      }))
    })

    afterEach(()=>{
      delete process.env['INPUT_VERSION'];
      delete process.env['INPUT_FILE'];
      delete process.env['INPUT_GPG_KEY'];
      delete process.env['INPUT_OUTPUT_TYPE'];
    })

    it('should install sops with version passed', async ()=>{
      await action.run()

      expect(mockSOPSInstall).toHaveBeenCalledWith('goodVersion', fs.chmodSync)
    })

    it('should import the gpg key passed', async ()=>{
      await action.run()

      expect(mockGPGImport).toHaveBeenCalledWith(gpg_key)
    })

    it('should decrypt the secret file passed', async ()=>{
      mockSOPSInstall.mockResolvedValue('path/to/sops/binary')
      mockSOPSOutputFormat.mockResolvedValue('json')
      await action.run()

      expect(mockSOPSDecrypt).toHaveBeenCalledWith('path/to/sops/binary',encrypted_file, 'json')
    })
  })
  describe('without passing a required key', ()=>{
    beforeEach(()=>{
      process.env['INPUT_VERSION'] = 'goodVersion';
      process.env['INPUT_FILE'] = encrypted_file;
    })

    afterEach(()=>{
      delete process.env['INPUT_VERSION'];
      delete process.env['INPUT_FILE'];
    })
    it('should throw an error', async ()=>{
      let expectedErrorMsg = 'Failed decrypting the file: Input required and not supplied: gpg_key'

      await action.run()

      await expect(mockCoreSetFaild).toHaveBeenCalledWith(expectedErrorMsg)
    })
  })

  describe('if an error is occured', ()=>{
    beforeEach(()=>{
      process.env['INPUT_VERSION'] = 'goodVersion';
      process.env['INPUT_FILE'] = encrypted_file;
      process.env['INPUT_GPG_KEY'] = gpg_key;
    })

    afterEach(()=>{
      delete process.env['INPUT_VERSION'];
      delete process.env['INPUT_FILE'];
      delete process.env['INPUT_GPG_KEY'];
    })

    describe('while getting the output format of sops', ()=>{
      beforeEach(()=>{
        mockSOPSOutputFormat.mockReturnValue(new Promise((resolve,reject) => {
          reject(new Error(`Error message from getOutputFormat`))
        }))
      })

      it('should return the error message', async ()=>{
        let expectedErrorMsg = `Failed decrypting the file: Error message from getOutputFormat`

        await action.run()

        expect(mockCoreSetFaild).toBeCalledWith(expectedErrorMsg);
      })
    })

    describe('while importing a gpg key', ()=>{
      beforeEach(()=>{
        mockGPGImport.mockReturnValue(new Promise((resolve,reject) => {
          reject(new Error(`Error message from gpg`))
        }))
      })

      it('should return the error message', async ()=>{
        let expectedErrorMsg = `Failed decrypting the file: Error message from gpg`

        await action.run()

        expect(mockCoreSetFaild).toBeCalledWith(expectedErrorMsg);
      })
    })

    describe('while decrypting a secret file', ()=>{
      beforeEach(()=>{
        mockSOPSDecrypt.mockReturnValue(new Promise((resolve,reject) => {
          reject(new Error(`Error message from sops`))
        }))
      })

      it('should return the error message', async ()=>{
        let expectedErrorMsg = `Failed decrypting the file: Error message from sops`

        await action.run()

        expect(mockCoreSetFaild).toBeCalledWith(expectedErrorMsg);
      })
    })
  })
})
