import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as path from 'path'

export async function install(version: string) {
  const toolName = 'sops'
  let extension = process.platform === 'win32' ? '.exe' : '';
  let url = downloadURL(version);
  let binaryPath = await download(version, toolName, extension, url);
  core.addPath(path.dirname(binaryPath))
}

export function downloadURL(version: string) {
  let extension = process.platform === 'win32' ? 'exe' : process.platform;

  return `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.${extension}`
}

export async function download(version: string, toolName: string, extension:string, url: string) {
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
