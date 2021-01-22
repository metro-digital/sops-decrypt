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
  const gpg_key = 'key1'
  beforeEach(()=>{
    process.env['STATE_GPG_KEY'] = gpg_key;
  })

  afterEach(()=>{
    delete process.env['STATE_GPG_KEY'];
  })
  describe('when gpg key is present', ()=>{
    beforeEach(()=>{
      mockKeyExists.mockResolvedValue(true)
    })

    it('should delete the gpg key imported', async()=>{
      mockFingerprint.mockResolvedValue('fpr')
      await action.run()

      expect(mockGPGDelete).toHaveBeenCalledWith('fpr')
    })
  })
  describe('when gpg key is not present', ()=>{
    beforeEach(()=>{
      mockKeyExists.mockResolvedValue(false)
    })

    it('should not try to delete the gpg key', async()=>{
      mockFingerprint.mockResolvedValue('fpr')
      await action.run()

      expect(mockGPGDelete).not.toHaveBeenCalled()
    })
  })
})
