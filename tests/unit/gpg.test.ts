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

      await gpg.import_key(btoa('sample_gpg_key'))

      expect(mockExec).toHaveBeenCalledWith('gpg', expectedArgs, 'sample_gpg_key')
    })

    it('should not throw an error', async ()=>{
      await expect(gpg.import_key(btoa('sample_gpg_key'))).resolves.not.toThrow();
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
      await expect(gpg.import_key(btoa('sample_gpg_key'))).rejects.toThrow();
    })

    it('should throw the error returned by the command', async ()=>{
      let expectedErrorMsg = 'Importing of GPG key failed: Error message from gpg'
      await expect(gpg.import_key(btoa('sample_gpg_key'))).rejects.toThrowError(expectedErrorMsg);
    })
  })
})
