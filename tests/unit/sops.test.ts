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

import { createTmpDir } from "../util"

process.env.RUNNER_TEMP = await createTmpDir()
process.env.RUNNER_TOOL_CACHE = await createTmpDir()

vi.mock('@actions/core', { spy: true})
vi.mock('@actions/tool-cache', { spy: true })
vi.mock('../../src/command.js')
vi.mock('../../src/sops.js', { spy: true })
vi.mock('../../src/gpg.js')

import { describe, expect, it, vi, beforeEach, afterEach, MockedFunction } from 'vitest'
import { sopsInstall, sopsDownloadURL, sopsDecrypt, sopsDownload, sopsGetOutputFormat } from '../../src/sops'
import { commandExec } from '../../src/command'
import { cacheFile as toolsCacheCacheFile, downloadTool as toolsCacheDownloadTool, find as toolsCacheFind } from '@actions/tool-cache'
import { addPath as coreAddPath } from '@actions/core'

const mockCacheFile = vi.mocked(toolsCacheCacheFile)
const mockDownloadTool = vi.mocked(toolsCacheDownloadTool)
const mockFindTool = vi.mocked(toolsCacheFind)
const mockAddPath = vi.mocked(coreAddPath)
const mockChmod: MockedFunction<Parameters<typeof sopsInstall>[1]> = vi.fn()
const mockExec = vi.mocked(commandExec)

afterEach(() => {
  mockCacheFile.mockReset()
  mockDownloadTool.mockReset()
  mockFindTool.mockReset()
  mockAddPath.mockReset()
  mockChmod.mockReset()
  mockExec.mockReset()
})

describe('When getting the download URL for SOPS', () => {
  let originalPlatform: string
  let originalArch: string
  beforeEach(() => {
    originalPlatform = process.platform
    originalArch = process.arch
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    })
    Object.defineProperty(process, 'arch', {
      value: originalArch
    })
  })

  describe('for versions lower than 3.7.1', () => {
    let version: string
    beforeEach(() => {
      version = '3.6.1'
    })
    it('should get the right URL for windows platform', () => {
      setPlatform('win32')
      const expectedURL = `https://github.com/getsops/sops/releases/download/v${version}/sops-v${version}.exe`

      const actualURL = sopsDownloadURL(version)

      expect(actualURL).toEqual(expectedURL)
    })

    it('should get the right URL for linux platform', () => {
      setPlatform('linux')
      const expectedURL = `https://github.com/getsops/sops/releases/download/v${version}/sops-v${version}.linux`

      const actualURL = sopsDownloadURL(version)

      expect(actualURL).toEqual(expectedURL)
    })

    it('should get the right URL for darwin platform', () => {
      setPlatform('darwin')
      const expectedURL = `https://github.com/getsops/sops/releases/download/v${version}/sops-v${version}.darwin`

      const actualURL = sopsDownloadURL(version)

      expect(actualURL).toEqual(expectedURL)
    })
  })
  describe('for versions greater than 3.7.1', () => {
    let version: string
    beforeEach(() => {
      version = 'v3.8.0'
    })
    it('should get the right URL for windows platform', () => {
      setPlatform('win32')
      const expectedURL = `https://github.com/getsops/sops/releases/download/v3.8.0/sops-v3.8.0.exe`

      const actualURL = sopsDownloadURL(version)

      expect(actualURL).toEqual(expectedURL)
    })

    it('should get the right URL for linux platform', () => {
      setPlatform('linux')
      setArch('x64')
      const expectedURL = `https://github.com/getsops/sops/releases/download/v3.8.0/sops-v3.8.0.linux.amd64`

      const actualURL = sopsDownloadURL(version)

      expect(actualURL).toEqual(expectedURL)
    })

    it('should get the right URL for darwin platform', () => {
      setPlatform('darwin')
      setArch('arm64')
      const expectedURL = `https://github.com/getsops/sops/releases/download/v3.8.0/sops-v3.8.0.darwin.arm64`

      const actualURL = sopsDownloadURL(version)

      expect(actualURL).toEqual(expectedURL)
    })
  
    it('should throw on unsupported platform', () => {
      setPlatform('android')
      setArch('arm64')

      expect(() => sopsDownloadURL(version)).toThrow('Unsupported platform: android')
    })
  
    it('should throw on unsupported architecture on linux', () => {
      setPlatform('linux')
      setArch('riscv64')

      expect(() => sopsDownloadURL(version)).toThrow('Unsupported architecture: riscv64')
    })
  
    it('should throw on unsupported architecture', () => {
      setPlatform('win32')
      setArch('mips')

      expect(() => sopsDownloadURL(version)).toThrow('Unsupported architecture: mips')
    })
  })
})

describe('When SOPS is being downloaded', () => {
  it('should download the tool if it is not cached in the runner', async () => {
    const version = '3.6.1'
    mockCacheFile.mockResolvedValue('binarypath')
    mockFindTool.mockReturnValue('')

    await sopsDownload(version, 'someextension', 'someurl')

    expect(mockDownloadTool).toHaveBeenCalledWith('someurl')
  })

  it('should not download the tool if it is cached in the runner', async () => {
    const version = '3.6.1'
    mockCacheFile.mockResolvedValue('binarypath')
    mockFindTool.mockReturnValue('binarypath')

    await sopsDownload(version, 'someextension', 'someurl')

    expect(mockDownloadTool).not.toHaveBeenCalled()
  })
})

describe('When SOPS is being installed', () => {
  it('should add execute permissions to the installed binary', async () => {
    const version = '3.6.1'
    mockCacheFile.mockResolvedValue('binarypath/version')

    await sopsInstall(version, mockChmod)

    expect(mockChmod).toHaveBeenCalledWith('binarypath/version/sops', '777')
  })

  it('should add the path of SOPS to PATH variable', async () => {
    const version = '3.6.1'
    mockCacheFile.mockResolvedValue('binarypath/version')

    await sopsInstall(version, mockChmod)

    expect(mockAddPath).toHaveBeenCalledWith('binarypath/version')
  })
})

describe('When execution of sops command', () => {
  const secretFile = 'folder1/encrypted_file.yaml'
  describe('is successful', () => {
    beforeEach(() => {
      mockExec.mockResolvedValue({
        status: true,
        output: 'decrypted',
        error: ''
      })
    })

    it('should pass the right arguments', async () => {
      const expectedArgs: string[] = []
      expectedArgs.push('--decrypt')
      expectedArgs.push('--output-type', 'json')
      expectedArgs.push(secretFile)

      await sopsDecrypt('sops', secretFile, 'json')

      expect(mockExec).toHaveBeenCalledWith('sops', expectedArgs)
    })

    it('should not throw an error', async () => {
      await expect(sopsDecrypt('sops', secretFile, 'json')).resolves.not.toThrow()
    })
  })

  describe('is a failure', () => {
    beforeEach(() => {
      mockExec.mockResolvedValue({
        status: false,
        output: '',
        error: 'Error message from SOPS'
      })
    })

    it('should throw an error', async () => {
      await expect(sopsDecrypt('sops', secretFile, '')).rejects.toThrow()
    })

    it('should throw the error returned by the command', async () => {
      const expectedErrorMsg = `Execution of sops command failed on ${secretFile}: Error message from SOPS`
      await expect(sopsDecrypt('sops', secretFile, '')).rejects.toThrowError(expectedErrorMsg)
    })
  })
})

describe('When getting the output format', () => {
  describe('if format is not specified', () => {
    it('should return json as default', () => {
      const expected = 'json'

      const actual = sopsGetOutputFormat('')

      expect(actual).toStrictEqual(expected)
    })
  })
  describe('If format is not supported by the action', () => {
    it('should throw an error', () => {
      const outputType = 'file'
      const expectedErrorMsg = `Output type "${outputType}" is not supported by sops-decrypt`
      expect(() => sopsGetOutputFormat(outputType)).toThrowError(expectedErrorMsg)
    })
  })
})

function setPlatform (platform: typeof process.platform) {
  Object.defineProperty(process, 'platform', {
    value: platform
  })
}

function setArch (arch: typeof process.arch) {
  Object.defineProperty(process, 'arch', {
    value: arch
  })
}
