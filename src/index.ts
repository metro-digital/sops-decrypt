import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as path from 'path'
import * as gpg from './gpg'
import * as sops from './sops'

const toolName = 'sops'

export async function install(toolName: string, chmod: Function, version: string) {
  let extension = process.platform === 'win32' ? '.exe' : '';
  let url = downloadURL(version);
  let binaryPath = await download(version, toolName, extension, url);
  chmod(binaryPath, '777')
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

export async function decrypt(base64_gpgKey: string, secret_file: string) {
  try {
    await gpg.import_key(base64_gpgKey)
    await sops.decrypt(secret_file)
  }
  catch(e) {
    throw new Error(`Failed decrypting the secret file: ${e.message}`)
  }
}
