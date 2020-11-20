import * as action from '../../src/index';
import * as core from '@actions/core';
import * as toolsCache from '@actions/tool-cache';
import { mocked } from 'ts-jest/utils';
import * as gpg from '../../src/gpg';
import * as sops from '../../src/sops'

jest.mock('@actions/core')
jest.mock('@actions/tool-cache')
jest.mock('../../src/gpg')
jest.mock('../../src/sops')

let mockCacheFile: jest.Mock
let mockDownloadTool: jest.Mock
let mockFindTool: jest.Mock
let mockAddPath: jest.Mock
let mockExecutePermission: jest.Mock
let mockGPGImport: jest.Mock
let mockSOPSDecrypt: jest.Mock

beforeEach(()=>{
  mockCacheFile = mocked(toolsCache.cacheFile, true)
  mockDownloadTool = mocked(toolsCache.downloadTool, true)
  mockFindTool = mocked(toolsCache.find, true)
  mockAddPath = mocked(core.addPath, true)
  mockExecutePermission = jest.fn()
  mockGPGImport = mocked(gpg.import_key, true)
  mockSOPSDecrypt = mocked(sops.decrypt, true)
})

afterEach(()=>{
  mockCacheFile.mockReset()
  mockDownloadTool.mockReset()
  mockFindTool.mockReset()
  mockAddPath.mockReset()
  mockExecutePermission.mockReset()
  mockGPGImport.mockReset()
  mockSOPSDecrypt.mockReset()
})

describe('When getting the download URL for SOPS', () => {
  let originalPlatform: string
  beforeEach(() => {
    originalPlatform = process.platform;
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  it('should get the right URL for windows platform', () => {
    const version = '3.6.1';
    setPlatform('win32')
    let expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.exe`

    let actualURL = action.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })

  it('should get the right URL for linux platform', () => {
    const version = '3.6.1';
    setPlatform('linux')
    let expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.linux`

    let actualURL = action.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })

  it('should get the right URL for darwin platform', () => {
    const version = '3.6.1';
    setPlatform('darwin')
    let expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.darwin`

    let actualURL = action.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })
})

describe('When SOPS is being downloaded', ()=> {
  it('should download the tool if it is not cached in the runner', async ()=>{
    const version = '3.6.1';
    mockCacheFile.mockResolvedValue('binarypath')
    mockFindTool.mockReturnValue('')

    await action.download(version, 'sops', 'someextension', 'someurl')

    expect(mockDownloadTool).toHaveBeenCalledWith('someurl');
  })

  it('should not download the tool if it is cached in the runner', async ()=>{
    const version = '3.6.1';
    mockCacheFile.mockResolvedValue('binarypath')
    mockFindTool.mockReturnValue('binarypath')

    await action.download(version, 'sops', 'someextension', 'someurl')

    expect(mockDownloadTool).not.toHaveBeenCalled();
  })
})

describe('When SOPS is being installed', ()=> {
  it('should add execute premissions to the installed binary', async ()=>{
    const version = '3.6.1';
    mockCacheFile.mockResolvedValue('binarypath/version')

    await action.install('sops', mockExecutePermission, version)

    expect(mockExecutePermission).toHaveBeenCalledWith('binarypath/version/sops', '777');
  })

  it('should add the path of SOPS to PATH variable', async ()=>{
    const version = '3.6.1';
    mockCacheFile.mockResolvedValue('binarypath/version')

    await action.install('sops', mockExecutePermission, version)

    expect(mockAddPath).toHaveBeenCalledWith('binarypath/version');
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

function setPlatform(platform:string) {
  Object.defineProperty(process, 'platform', {
    value: platform
  });
}
