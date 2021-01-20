import { mocked } from 'ts-jest/utils';
import * as core from '@actions/core';
import * as action from '../../src/post-action';
import * as gpg from '../../src/gpg';

jest.mock('../../src/gpg')

let mockGPGDelete: jest.Mock

jest.spyOn(core, 'info').mockImplementation(jest.fn())
jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
jest.spyOn(core, 'saveState').mockImplementation(jest.fn())

beforeEach(()=>{
  mockGPGDelete = mocked(gpg.delete_key, true)
})

afterEach(()=>{
  mockGPGDelete.mockReset()
})

describe('When the post action is triggered', ()=>{
  const gpg_key = 'key1'
  beforeEach(()=>{
    process.env['STATE_GPG_KEY'] = gpg_key;
  })

  afterEach(()=>{
    delete process.env['STATE_GPG_KEY'];
  })

  it('should delete the gpg key imported', async()=>{
    await action.run()

    expect(mockGPGDelete).toHaveBeenCalledWith(gpg_key)
  })
})
