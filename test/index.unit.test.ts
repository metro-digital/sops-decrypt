import * as sops from '../src/index';
import * as core from '@actions/core';
import * as toolsCache from '@actions/tool-cache';
import { mocked } from 'ts-jest/utils';

jest.mock('@actions/core')
jest.mock('@actions/tool-cache')

let mockCacheFile: jest.Mock
let mockDownloadTool: jest.Mock
let mockFindTool: jest.Mock
let mockAddPath: jest.Mock
let mockExecutePermission: jest.Mock

beforeEach(()=>{
  mockCacheFile = mocked(toolsCache.cacheFile, true)
  mockDownloadTool = mocked(toolsCache.downloadTool, true)
  mockFindTool = mocked(toolsCache.find, true)
  mockAddPath = mocked(core.addPath, true)
  mockExecutePermission = jest.fn()
})

afterEach(()=>{
  mockCacheFile.mockReset()
  mockDownloadTool.mockReset()
  mockFindTool.mockReset()
  mockAddPath.mockReset()
  mockExecutePermission.mockReset()
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

    let actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })

  it('should get the right URL for linux platform', () => {
    const version = '3.6.1';
    setPlatform('linux')
    let expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.linux`

    let actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })

  it('should get the right URL for darwin platform', () => {
    const version = '3.6.1';
    setPlatform('darwin')
    let expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.darwin`

    let actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })
})

describe('When SOPS is being downloaded', ()=> {
  it('should download the tool if it is not cached in the runner', async ()=>{
    const version = '3.6.1';
    mockCacheFile.mockResolvedValue('binarypath')
    mockFindTool.mockReturnValue('')

    await sops.download(version, 'sops', 'someextension', 'someurl')

    expect(mockDownloadTool).toHaveBeenCalledWith('someurl');
  })

  it('should not download the tool if it is cached in the runner', async ()=>{
    const version = '3.6.1';
    mockCacheFile.mockResolvedValue('binarypath')
    mockFindTool.mockReturnValue('binarypath')

    await sops.download(version, 'sops', 'someextension', 'someurl')

    expect(mockDownloadTool).not.toHaveBeenCalled();
  })
})

describe('When SOPS is being installed', ()=> {
  it('should add execute premissions to the installed binary', async ()=>{
    const version = '3.6.1';
    mockCacheFile.mockResolvedValue('binarypath/version')

    await sops.install(mockExecutePermission, version)

    expect(mockExecutePermission).toHaveBeenCalledWith('binarypath/version/sops', '777');
  })

  it('should add the path of SOPS to PATH variable', async ()=>{
    const version = '3.6.1';
    mockCacheFile.mockResolvedValue('binarypath/version')

    await sops.install(mockExecutePermission, version)

    expect(mockAddPath).toHaveBeenCalledWith('binarypath/version');
  })
})

function setPlatform(platform:string) {
  Object.defineProperty(process, 'platform', {
    value: platform
  });
}
