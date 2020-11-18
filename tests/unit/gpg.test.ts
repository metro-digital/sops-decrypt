import * as gpg from '../../src/gpg'
import * as command from '../../src/command'
import { mocked } from 'ts-jest/utils';

jest.mock('../../src/command')

let mockExec: jest.Mock

beforeEach(()=>{
  mockExec = mocked(command.exec, true)
})

afterEach(()=>{
  mockExec.mockReset()
})

describe('when a gpg key is imported', ()=>{
  it('should pass the right arguments', async ()=>{
    let expectedArgs: string[] = [];
    expectedArgs.push('--import')

    await gpg.import_key(btoa('sample_gpg_key'))

    expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs, 'sample_gpg_key')
  })
})
