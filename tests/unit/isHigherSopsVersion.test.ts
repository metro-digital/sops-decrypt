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

describe('When checking for higher versions of SOPS', () => {
  let originalPlatform: string
  beforeEach(() => {
    originalPlatform = process.platform
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    })
  })

  it('should return false for version 3.6.1', () => {
    const version = '3.6.1'
    setPlatform('win32')
    const expected = false

    const actual = sops.isVersionGreaterThan371(version)

    expect(actual).toEqual(expected)
  })

  it('should return false for version v3.7.1', () => {
    const version = '3.7.1'
    setPlatform('win32')
    const expected = false

    const actual = sops.isVersionGreaterThan371(version)

    expect(actual).toEqual(expected)
  })

  it('should return true for version v3.8.0', () => {
    const version = '3.8.0'
    setPlatform('win32')
    const expected = true

    const actual = sops.isVersionGreaterThan371(version)

    expect(actual).toEqual(expected)
  })
})

function setPlatform (platform:string) {
  Object.defineProperty(process, 'platform', {
    value: platform
  })
}