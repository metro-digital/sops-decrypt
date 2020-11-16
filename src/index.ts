import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

export async function installSOPS(version: string) {
  const toolName = 'sops'
  let extension = os.platform() === 'win32' ? '.exe' : '';
  let url = downloadURL(version, extension);
  let binaryPath = await downloadSOPS(version, toolName, extension, url)

  core.addPath(path.dirname(binaryPath))
}

function downloadURL(version: string, fileExtension: string) {
  if(fileExtension === '') {
    fileExtension = os.platform()
  }

  return `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.${fileExtension}`
}

async function downloadSOPS(version: string, toolName: string, extension:string, url: string) {
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

  fs.chmodSync(executablePath, '777');

  return executablePath
}
