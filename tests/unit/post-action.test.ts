import { mocked } from 'ts-jest/utils';
import * as core from '@actions/core';
import * as action from '../../src/post-action';
import * as gpg from '../../src/gpg';

jest.mock('../../src/gpg')

let mockGPGDelete: jest.Mock
let mockFingerprint: jest.Mock
let mockKeyExists: jest.Mock

jest.spyOn(core, 'info').mockImplementation(jest.fn())
jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
jest.spyOn(core, 'saveState').mockImplementation(jest.fn())

beforeEach(()=>{
  mockGPGDelete = mocked(gpg.delete_key, true)
  mockFingerprint = mocked(gpg.fingerprint, true)
  mockKeyExists = mocked(gpg.key_exists, true)
})

afterEach(()=>{
  mockGPGDelete.mockReset()
  mockFingerprint.mockReset()
  mockKeyExists.mockReset()
})

describe('When the post action is triggered', ()=>{
  describe('when the state variable is set', ()=>{
    beforeEach(()=>{
      process.env['STATE_GPG_KEY'] = 'key1';
    })
    afterEach(()=>{
      delete process.env['STATE_GPG_KEY'];
    })
    describe('when the runner gpg keyring has the gpg key', ()=>{
      beforeEach(()=>{
        mockKeyExists.mockResolvedValue(true)
      })

      it('should delete the gpg key imported', async()=>{
        mockFingerprint.mockResolvedValue('fpr')
        await action.run()

        expect(mockGPGDelete).toHaveBeenCalledWith('fpr')
      })
    })
    describe('when the runner gpg keyring does not have the gpg key', ()=>{
      beforeEach(()=>{
        mockKeyExists.mockResolvedValue(false)
      })

      it('should not try to delete the gpg key', async()=>{
        mockFingerprint.mockResolvedValue('fpr')
        await action.run()

        expect(mockGPGDelete).not.toHaveBeenCalled()
      })
    })
    describe('if an error is occured', ()=>{
      describe('while retrieving the fingerprint', ()=>{
        beforeEach(()=>{
          mockFingerprint.mockReturnValue(new Promise((resolve,reject) => {
            reject(new Error(`Error message from fingerprint`))
          }))
        })

        it('should return the error message', async ()=>{
          let expectedErrorMsg = 'Error while deleting the gpg key: Error message from fingerprint'

          await expect(action.run()).rejects.toThrowError(expectedErrorMsg);
        })
      })

      describe('while deleting the gpg key', ()=>{
        beforeEach(()=>{
          mockKeyExists.mockReturnValue(true)
          mockGPGDelete.mockReturnValue(new Promise((resolve,reject) => {
            reject(new Error(`Error message while deleting the gpg key`))
          }))
        })

        it('should return the error message', async ()=>{
          let expectedErrorMsg = 'Error while deleting the gpg key: Error message while deleting the gpg key'

          await expect(action.run()).rejects.toThrowError(expectedErrorMsg);
        })
      })
    })
  })

  describe('when the state variable is not set', ()=>{
    it('should not get the fingerprint', async ()=>{
      await action.run()

      expect(mockFingerprint).not.toHaveBeenCalled()
    })
  })
})
