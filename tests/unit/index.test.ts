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
  describe('passing the sops version', ()=>{
    beforeEach(()=>{
      process.env['INPUT_VERSION'] = 'goodVersion';
    })

    afterEach(()=>{
      delete process.env['INPUT_VERSION'];
    })

    it('should install sops with version passed', async ()=>{
      await action.run()

      expect(mockSOPSInstall).toHaveBeenCalledWith('goodVersion', fs.chmodSync)
    })
  })
})

describe('When decryption of secret file', ()=>{
  describe('is successful', ()=>{
    beforeEach(()=>{
      mockGPGImport.mockReturnValue(new Promise((resolve,reject) => {
        resolve()
      }))
      mockSOPSDecrypt.mockReturnValue(new Promise((resolve,reject) => {
        resolve()
      }))
    })

    it('should use the right PGP key importing', async ()=>{
      let expectedGPGKey = 'sample_key'
      let secretFile = 'encrypted_file.yaml'

      await action.decrypt(expectedGPGKey, secretFile)

      expect(mockGPGImport).toHaveBeenCalledWith(expectedGPGKey)
    })

    it('should use the right encrypted file to decrypt', async ()=>{
      let secretFile = 'encrypted_file.yaml'

      await action.decrypt('sample_gpg_key', secretFile)

      expect(mockSOPSDecrypt).toHaveBeenCalledWith(secretFile)
    })
  })

  describe('is a failure', ()=>{
    describe('when importing a gpg key', ()=>{
      beforeEach(()=>{
        mockGPGImport.mockReturnValue(new Promise((resolve,reject) => {
          reject(new Error(`Error message from gpg`))
        }))
      })

      it('should return the error message', async ()=>{
        let expectedErrorMsg = 'Failed decrypting the secret file: Error message from gpg'

        await expect(action.decrypt('sample_gpg_key', 'secret_file.yaml')).rejects.toThrowError(expectedErrorMsg);
      })
    })

    describe('when execution of sops command fails', ()=>{
      beforeEach(()=>{
        mockSOPSDecrypt.mockReturnValue(new Promise((resolve,reject) => {
          reject(new Error(`Error message from sops`))
        }))
      })

      it('should return the error message', async ()=>{
        let expectedErrorMsg = 'Failed decrypting the secret file: Error message from sops'

        await expect(action.decrypt('sample_gpg_key', 'secret_file.yaml')).rejects.toThrowError(expectedErrorMsg);
      })
    })
  })
})
