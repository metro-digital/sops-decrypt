import * as action from '../../src/index';
import * as fs from 'fs'
import { mocked } from 'ts-jest/utils';
import * as gpg from '../../src/gpg';
import * as sops from '../../src/sops';

jest.mock('../../src/sops')
jest.mock('../../src/gpg')

let mockGPGImport: jest.Mock
let mockSOPSDecrypt: jest.Mock
let mockSOPSInstall: jest.Mock

beforeEach(()=>{
  mockGPGImport = mocked(gpg.import_key, true)
  mockSOPSDecrypt = mocked(sops.decrypt, true)
  mockSOPSInstall = mocked(sops.install, true)
})

afterEach(()=>{
  mockGPGImport.mockReset()
  mockSOPSDecrypt.mockReset()
  mockSOPSInstall.mockReset()
})

describe('When the action is triggered', ()=>{
  const encrypted_file = 'encrypted/file1'
  const gpg_key = 'key1'
  describe('by passing the required variables', ()=>{
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

    it('should install sops with version passed', async ()=>{
      await action.run()

      expect(mockSOPSInstall).toHaveBeenCalledWith('goodVersion', fs.chmodSync)
    })

    it('should import the gpg key passed', async ()=>{
      await action.run()

      expect(mockGPGImport).toHaveBeenCalledWith(gpg_key)
    })

    it('should decrypt the secret file passed', async ()=>{
      await action.run()

      expect(mockSOPSDecrypt).toHaveBeenCalledWith(encrypted_file)
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
      let expectedErrorMsg = 'Failed decrypting the secret file: Input required and not supplied: gpg_key'

      await expect(action.run()).rejects.toThrowError(expectedErrorMsg);
    })
  })
  describe('an error is occured', ()=>{
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

    describe('when importing a gpg key', ()=>{
      beforeEach(()=>{
        mockGPGImport.mockReturnValue(new Promise((resolve,reject) => {
          reject(new Error(`Error message from gpg`))
        }))
      })

      it('should return the error message', async ()=>{
        let expectedErrorMsg = 'Failed decrypting the secret file: Error message from gpg'

        await expect(action.run()).rejects.toThrowError(expectedErrorMsg);
      })
    })

    describe('when decrypting a secret file', ()=>{
      beforeEach(()=>{
        mockSOPSDecrypt.mockReturnValue(new Promise((resolve,reject) => {
          reject(new Error(`Error message from sops`))
        }))
      })

      it('should return the error message', async ()=>{
        let expectedErrorMsg = 'Failed decrypting the secret file: Error message from sops'

        await expect(action.run()).rejects.toThrowError(expectedErrorMsg);
      })
    })
  })
})
