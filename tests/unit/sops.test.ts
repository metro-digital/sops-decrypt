/*
 * Copyright 2021 METRO Digital GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as sops from '../../src/sops'
import * as command from '../../src/command'
import * as core from '@actions/core'
import * as toolsCache from '@actions/tool-cache'
import { mocked } from 'jest-mock'

jest.mock('@actions/core')
jest.mock('@actions/tool-cache')
jest.mock('../../src/command')
jest.mock('../../src/gpg')

let mockCacheFile: jest.MockedFunction<typeof toolsCache.cacheFile>
let mockDownloadTool: jest.MockedFunction<typeof toolsCache.downloadTool>
let mockFindTool: jest.MockedFunction<typeof toolsCache.find>
let mockAddPath: jest.MockedFunction<typeof core.addPath>
let mockExecutePermission: jest.MockedFunction<typeof jest.fn>
let mockExec: jest.MockedFunction<typeof command.exec>

beforeEach(() => {
  mockCacheFile = mocked(toolsCache.cacheFile)
  mockDownloadTool = mocked(toolsCache.downloadTool)
  mockFindTool = mocked(toolsCache.find)
  mockAddPath = mocked(core.addPath)
  mockExecutePermission = jest.fn()
  mockExec = mocked(command.exec)
})

afterEach(() => {
  mockCacheFile.mockReset()
  mockDownloadTool.mockReset()
  mockFindTool.mockReset()
  mockAddPath.mockReset()
  mockExecutePermission.mockReset()
  mockExec.mockReset()
})

describe('When getting the download URL for SOPS', () => {
  let originalPlatform: string
  beforeEach(() => {
    originalPlatform = process.platform
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    })
  })

  it('should get the right URL for windows platform', () => {
    const version = '3.6.1'
    setPlatform('win32')
    const expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.exe`

    const actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })

  it('should get the right URL for linux platform', () => {
    const version = '3.6.1'
    setPlatform('linux')
    const expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.linux`

    const actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })

  it('should get the right URL for darwin platform', () => {
    const version = '3.6.1'
    setPlatform('darwin')
    const expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.darwin`

    const actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })
})

describe('When SOPS is being downloaded', () => {
  it('should download the tool if it is not cached in the runner', async () => {
    const version = '3.6.1'
    mockCacheFile.mockResolvedValue('binarypath')
    mockFindTool.mockReturnValue('')

    await sops.download(version, 'someextension', 'someurl')

    expect(mockDownloadTool).toHaveBeenCalledWith('someurl')
  })

  it('should not download the tool if it is cached in the runner', async () => {
    const version = '3.6.1'
    mockCacheFile.mockResolvedValue('binarypath')
    mockFindTool.mockReturnValue('binarypath')

    await sops.download(version, 'someextension', 'someurl')

    expect(mockDownloadTool).not.toHaveBeenCalled()
  })
})

describe('When SOPS is being installed', () => {
  it('should add execute permissions to the installed binary', async () => {
    const version = '3.6.1'
    mockCacheFile.mockResolvedValue('binarypath/version')

    await sops.install(version, mockExecutePermission)

    expect(mockExecutePermission).toHaveBeenCalledWith('binarypath/version/sops', '777')
  })

  it('should add the path of SOPS to PATH variable', async () => {
    const version = '3.6.1'
    mockCacheFile.mockResolvedValue('binarypath/version')

    await sops.install(version, mockExecutePermission)

    expect(mockAddPath).toHaveBeenCalledWith('binarypath/version')
  })
})

describe('When execution of sops command', () => {
  const secretFile = 'folder1/encrypted_file.yaml'
  describe('is successful', () => {
    beforeEach(() => {
      mockExec.mockReturnValue(Promise.resolve({
        status: true,
        output: 'decrypted',
        error: ''
      }))
    })

    it('should pass the right arguments', async () => {
      const expectedArgs: string[] = []
      expectedArgs.push('--decrypt')
      expectedArgs.push('--output-type', 'json')
      expectedArgs.push(secretFile)

      await sops.decrypt('sops', secretFile, 'json')

      expect(mockExec).toHaveBeenCalledWith('sops', expectedArgs)
    })

    it('should not throw an error', async () => {
      await expect(sops.decrypt('sops', secretFile, 'json')).resolves.not.toThrow()
    })
  })

  describe('is a failure', () => {
    beforeEach(() => {
      mockExec.mockReturnValue(Promise.resolve({
        status: false,
        output: '',
        error: 'Error message from SOPS'
      }))
    })

    it('should throw an error', async () => {
      await expect(sops.decrypt('sops', secretFile, '')).rejects.toThrow()
    })

    it('should throw the error returned by the command', async () => {
      const expectedErrorMsg = `Execution of sops command failed on ${secretFile}: Error message from SOPS`
      await expect(sops.decrypt('sops', secretFile, '')).rejects.toThrowError(expectedErrorMsg)
    })
  })
})

describe('When getting the output format', () => {
  describe('if format is not specified', () => {
    it('should return json as default', async () => {
      const expected = 'json'

      const actual = await sops.getOutputFormat('')

      expect(actual).toStrictEqual(expected)
    })
  })
  describe('If format is not supported by the action', () => {
    it('should throw an error', async () => {
      const outputType = 'file'
      const expectedErrorMsg = `Output type "${outputType}" is not supported by sops-decrypt`
      expect(() => sops.getOutputFormat(outputType)).toThrowError(expectedErrorMsg)
    })
  })
})

function setPlatform (platform:string) {
  Object.defineProperty(process, 'platform', {
    value: platform
  })
}
