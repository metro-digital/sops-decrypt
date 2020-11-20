import * as sops from '../../src/sops'
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

describe('When execution of sops command',()=>{
  let secretFile = 'folder1/encrypted_file.yaml'
  describe('is successful', ()=>{
    beforeEach(()=>{
      mockExec.mockReturnValue({
        status: true,
        output: 'decrypted',
        error: ''
      } as command.Result)
    })

    it('should pass the right arguments', async ()=>{
      let expectedArgs: string[] = [];
      expectedArgs.push('--decrypt')
      expectedArgs.push('--output-type', 'json')
      expectedArgs.push(secretFile)

      await sops.decrypt(secretFile)

      expect(mockExec).toHaveBeenCalledWith('sops', expectedArgs)
    })

    it('should not throw an error', async ()=>{
      await expect(sops.decrypt(secretFile)).resolves.not.toThrow();
    })
  })

  describe('is a failure', ()=>{
    beforeEach(()=>{
      mockExec.mockReturnValue({
        status: false,
        output: '',
        error: 'Error message from SOPS'
      } as command.Result)
    })

    it('should throw an error', async ()=>{
      await expect(sops.decrypt(secretFile)).rejects.toThrow();
    })

    it('should throw the error returned by the command', async ()=>{
      let expectedErrorMsg = 'Execution of sops command failed: Error message from SOPS'
      await expect(sops.decrypt(secretFile)).rejects.toThrowError(expectedErrorMsg);
    })
  })
})
