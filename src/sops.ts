import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as path from 'path'
import * as command from './command'

const toolName = 'sops'

export async function decrypt(sops: string, secret_file: string, output_type: string) : Promise<command.Result> {
  let sopsArgs: string[] = []
  sopsArgs.push('--decrypt')
  sopsArgs.push('--output-type', output_type)
  sopsArgs.push(secret_file)
  let result: command.Result = await command.exec(sops, sopsArgs)
  if(!result.status) {
    return new Promise((resolve,reject) => {
      reject(new Error(`Execution of sops command failed: ${result.error}`))
    })
  }

  return new Promise((resolve,reject) => {
    resolve(result)
  })
}

export async function install(version: string, chmod: Function) {
  let extension = process.platform === 'win32' ? '.exe' : '';
  let url = downloadURL(version);
  let binaryPath = await download(version, extension, url);
  chmod(binaryPath, '777')
  core.addPath(path.dirname(binaryPath))
  return binaryPath
}

export function downloadURL(version: string) {
  let extension = process.platform === 'win32' ? 'exe' : process.platform;

  return `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.${extension}`
}

export async function download(version: string, extension:string, url: string) {
  let cachedToolpath = toolCache.find(toolName, version);
  if (!cachedToolpath) {
    core.debug(`Downloading ${toolName} from: ${url}`);

    let downloadedToolPath: string;
    try {
      downloadedToolPath = await toolCache.downloadTool(url);
    } catch (error) {
      core.debug(error);
      throw `Failed to download version ${version}: ${error}`;
    }

    cachedToolpath = await toolCache.cacheFile(
      downloadedToolPath,
      toolName + extension,
      toolName,
      version
    );
  }

  const executablePath = path.join(
    cachedToolpath,
    toolName + extension,
  );

  return executablePath
}
