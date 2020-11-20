import * as gpg from '../../src/gpg'
import * as command from '../../src/command'
import { mocked } from 'ts-jest/utils';

jest.mock('../../src/command')

let mockExec: jest.Mock

beforeEach(()=>{
  mockExec = mocked(command.exec, true)
  mockExec.mockReturnValue({
    status: true,
    output: 'imported',
    error: 'Unable to imort the gpg key'
  } as command.Result)
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

  it('should throw an error if import fails', async ()=>{
    mockExec.mockReturnValue({
          status: false,
          output: '',
          error: 'Unable to import the gpg key'
      } as command.Result)

    await expect(gpg.import_key(btoa('sample_gpg_key'))).rejects.toThrowError('Unable to import the gpg key');
  })
})
