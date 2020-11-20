import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as io from '@actions/io'
import * as core from '@actions/core'
import * as action from '../../src/index';

const runnerDir = path.join(__dirname, 'runner')
const toolsDir = path.join(runnerDir, 'tools');
const toolsTempDir = path.join(runnerDir, 'temp');

process.env.RUNNER_TOOL_CACHE = toolsDir;
process.env.RUNNER_TEMP = toolsTempDir;

describe('When SOPS pacakge does not exist in caching directory', () => {
  beforeAll(()=>{
    jest.spyOn(core, 'debug').mockImplementation(jest.fn())
    jest.spyOn(core, 'addPath').mockImplementation(jest.fn())
  })

  afterEach(async ()=>{
    delete process.env.RUNNER_TOOL_CACHE
    delete process.env.RUNNER_TEMP
    await io.rmRF(runnerDir)
  })

  it('should download the given version of SOPS pacakge', async () => {
    const version = '3.6.1';
    const dir = path.join(toolsDir, 'sops', version, os.arch());

    await action.run()

    expect(fs.existsSync(path.join(dir, 'sops'))).toBe(true);
  }, 100000)
})
