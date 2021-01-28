import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as io from '@actions/io'
import * as core from '@actions/core'
import * as action from '../../src/action';
import * as gpg_keys from '../fixtures/gpg_private_keys'

jest.spyOn(core, 'debug').mockImplementation(jest.fn())
jest.spyOn(core, 'addPath').mockImplementation(jest.fn())
jest.spyOn(core, 'setFailed').mockImplementation(jest.fn())
jest.spyOn(core, 'info').mockImplementation(jest.fn())
jest.spyOn(core, 'saveState').mockImplementation(jest.fn())
let mockSetOutput = jest.spyOn(core, 'setOutput').mockImplementation(jest.fn())

const runnerDir = path.join(__dirname, 'runner')
const toolsDir = path.join(runnerDir, 'tools');
const toolsTempDir = path.join(runnerDir, 'temp');

beforeAll(async ()=>{
  process.env.RUNNER_TOOL_CACHE = toolsDir;
  process.env.RUNNER_TEMP = toolsTempDir;
  process.env.INPUT_VERSION = '3.6.1';
  process.env.INPUT_FILE = 'tests/fixtures/sops_encrypted_file.yaml'
  process.env.INPUT_GPG_KEY = gpg_keys.base64_private_key1
})

afterAll(async ()=>{
  delete process.env.RUNNER_TOOL_CACHE
  delete process.env.RUNNER_TEMP
  delete process.env.INPUT_VERSION
  delete process.env.INPUT_GPG_KEY
  delete process.env.INPUT_FILE
  await io.rmRF(runnerDir)
})

describe('When the action is triggered with output not set', () => {
  beforeAll(async ()=>{
    await action.run()
  }, 100000)

  it('should download the given version of SOPS pacakge', async () => {
    const dir = path.join(toolsDir, 'sops', '3.6.1', os.arch());

    expect(fs.existsSync(path.join(dir, 'sops'))).toBe(true);
  })

  it('should be able to set decrypted content as output', async () => {
    let exepectedData = {
      Planet: "earth",
      Hello: "world"
    }

    expect(mockSetOutput).toHaveBeenCalledWith('data', exepectedData)
  })
})

describe('When the action is triggered with output set to dotenv', () => {
  beforeAll(async ()=>{
    process.env.INPUT_OUTPUT_TYPE = 'dotenv'

    await action.run()
  }, 100000)

  afterAll(async ()=>{
    delete process.env.INPUT_OUTPUT_TYPE
  })

  it('should download the given version of SOPS pacakge', async () => {
    const dir = path.join(toolsDir, 'sops', '3.6.1', os.arch());

    expect(fs.existsSync(path.join(dir, 'sops'))).toBe(true);
  })

  it('should be able to set decrypted content as output', async () => {
    let exepectedData = 'Planet=earth\nHello=world'

    expect(mockSetOutput).toHaveBeenCalledWith('data', exepectedData)
  })
})

describe('When the action is triggered with output set to yaml', () => {
  beforeAll(async ()=>{
    process.env.INPUT_OUTPUT_TYPE = 'yaml'

    await action.run()
  }, 100000)

  afterAll(async ()=>{
    delete process.env.INPUT_OUTPUT_TYPE
  })

  it('should download the given version of SOPS pacakge', async () => {
    const dir = path.join(toolsDir, 'sops', '3.6.1', os.arch());

    expect(fs.existsSync(path.join(dir, 'sops'))).toBe(true);
  })

  it('should be able to set decrypted content as output', async () => {
    let exepectedData = 'Planet: earth\nHello: world'

    expect(mockSetOutput).toHaveBeenCalledWith('data', exepectedData)
  })
})
