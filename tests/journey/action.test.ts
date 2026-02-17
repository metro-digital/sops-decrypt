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

import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { setOutput as coreSetOutput, setSecret as coreSetSecret} from "@actions/core"
import { rmRF as ioRmRF} from '@actions/io'
import { actionRun } from '../../src/action'
import { gpg_fixture_base64_private_key1 } from '../fixtures/gpg_private_keys'

vi.mock('@actions/core', { spy: true})

const runnerDir = path.join(__dirname, 'runner')
const toolsDir = path.join(runnerDir, 'tools')
const toolsTempDir = path.join(runnerDir, 'temp')

beforeAll(async () => {
  process.env.RUNNER_TOOL_CACHE = toolsDir
  process.env.RUNNER_TEMP = toolsTempDir
  process.env.INPUT_VERSION = '3.6.1'
  process.env.INPUT_FILE = 'tests/fixtures/sops_encrypted_file.yaml'
  process.env.INPUT_GPG_KEY = gpg_fixture_base64_private_key1
})

afterAll(async () => {
  delete process.env.RUNNER_TOOL_CACHE
  delete process.env.RUNNER_TEMP
  delete process.env.INPUT_VERSION
  delete process.env.INPUT_GPG_KEY
  delete process.env.INPUT_FILE
  await ioRmRF(runnerDir)
})

describe('When the action is triggered with output not set', () => {
  beforeAll(async () => {
    await actionRun()
  }, 100000)

  it('should download the given version of SOPS package', async () => {
    const dir = path.join(toolsDir, 'sops', '3.6.1', os.arch())

    expect(fs.existsSync(path.join(dir, 'sops'))).toBe(true)
  })

  it('should be able to set decrypted content as output', async () => {
    const expectedData = {
      Planet: 'earth',
      Hello: 'world'
    }

    expect(coreSetOutput).toHaveBeenCalledWith('data', expectedData)
    expect(coreSetSecret).toHaveBeenCalledWith('earth')
    expect(coreSetSecret).toHaveBeenCalledWith('world')
  })
})

describe('When the action is triggered with output set to dotenv', () => {
  beforeAll(async () => {
    process.env.INPUT_OUTPUT_TYPE = 'dotenv'

    await actionRun()
  }, 100000)

  afterAll(async () => {
    delete process.env.INPUT_OUTPUT_TYPE
  })

  it('should download the given version of SOPS package', async () => {
    const dir = path.join(toolsDir, 'sops', '3.6.1', os.arch())

    expect(fs.existsSync(path.join(dir, 'sops'))).toBe(true)
  })

  it('should be able to set decrypted content as output', async () => {
    const expectedData = 'Planet=earth\nHello=world'

    expect(coreSetOutput).toHaveBeenCalledWith('data', expectedData)
    expect(coreSetSecret).toHaveBeenCalledWith('earth')
    expect(coreSetSecret).toHaveBeenCalledWith('world')
  })
})

describe('When the action is triggered with output set to yaml', () => {
  beforeAll(async () => {
    process.env.INPUT_OUTPUT_TYPE = 'yaml'

    await actionRun()
  }, 100000)

  afterAll(async () => {
    delete process.env.INPUT_OUTPUT_TYPE
  })

  it('should download the given version of SOPS package', async () => {
    const dir = path.join(toolsDir, 'sops', '3.6.1', os.arch())

    expect(fs.existsSync(path.join(dir, 'sops'))).toBe(true)
  })

  it('should be able to set decrypted content as output', async () => {
    const expectedData = 'Planet: earth\nHello: world'

    expect(coreSetOutput).toHaveBeenCalledWith('data', expectedData)
    expect(coreSetSecret).toHaveBeenCalledWith('earth')
    expect(coreSetSecret).toHaveBeenCalledWith('world')
  })
})
