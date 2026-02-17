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

import { debug as coreDebug, info as coreInfo, addPath as coreAddPath } from "@actions/core";
import {
  cacheFile as toolCacheCacheFile,
  find as toolCacheFind,
  downloadTool as toolCacheDownloadTool,
} from "@actions/tool-cache";
import { dirname as pathDirname, join as pathJoin } from "node:path";
import { commandExec } from "./command.js";

const toolName = "sops";

const OutputFormats = ["json", "yaml", "dotenv"] as const;
export type OutputFormat = (typeof OutputFormats)[number];

export async function sopsDecrypt(sops: string, secretFile: string, outputType: string) {
  const sopsArgs: string[] = [];
  sopsArgs.push("--decrypt");
  sopsArgs.push("--output-type", outputType);
  sopsArgs.push(secretFile);
  coreInfo(`Decrypting the secrets to ${outputType} format`);
  const result = await commandExec(sops, sopsArgs);
  if (!result.status) {
    coreInfo("Unable to decrypt the secrets");
    throw new Error(`Execution of sops command failed on ${secretFile}: ${result.error}`);
  }

  coreInfo("Successfully decrypted the secrets");
  return result.output;
}

export async function sopsInstall(version: string, chmod: (path: string, mode: string) => void) {
  const extension = process.platform === "win32" ? ".exe" : "";
  const url = sopsDownloadURL(version);
  const binaryPath = await sopsDownload(version, extension, url);
  chmod(binaryPath, "777");
  coreAddPath(pathDirname(binaryPath));
  return binaryPath;
}

export function sopsDownloadURL(version: string) {
  const versionNumber = version.startsWith("v") ? version.slice(1) : version;

  switch (process.platform) {
    case "darwin":
    // eslint-disable-next-line no-fallthrough
    case "linux":
      if (sopsIsVersionGreaterThan371(versionNumber)) {
        let arch: string = process.arch;
        if (arch === "x64") {
          arch = "amd64";
        } else if (arch === "arm64") {
          arch = "arm64";
        } else {
          throw new Error(`Unsupported architecture: ${arch}`);
        }

        return `https://github.com/getsops/sops/releases/download/v${versionNumber}/sops-v${versionNumber}.${process.platform}.${arch}`;
      }

      return `https://github.com/getsops/sops/releases/download/v${versionNumber}/sops-v${versionNumber}.${process.platform}`;
    case "win32":
      if (process.arch !== "x64") {
        throw new Error(`Unsupported architecture: ${process.arch}`);
      }
      return `https://github.com/getsops/sops/releases/download/v${versionNumber}/sops-v${versionNumber}.exe`;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

export function sopsIsVersionGreaterThan371(version: string) {
  const [major, minor, patch] = version.split(".").map(Number);

  return major > 3 || (major === 3 && minor > 7) || (major === 3 && minor === 7 && patch > 1);
}

export async function sopsDownload(version: string, extension: string, url: string) {
  let cachedToolPath = toolCacheFind(toolName, version);
  if (!cachedToolPath) {
    coreDebug(`Downloading ${toolName} from: ${url}`);

    let downloadedToolPath: string;
    try {
      downloadedToolPath = await toolCacheDownloadTool(url);
    } catch (error: unknown) {
      coreDebug((error as Error).message);
      throw new Error(`Failed to download version ${version}: ${error}`);
    }

    cachedToolPath = await toolCacheCacheFile(downloadedToolPath, toolName + extension, toolName, version);
  }

  const executablePath = pathJoin(cachedToolPath, toolName + extension);

  return executablePath;
}

function sopsIsOutputFormat(value: string): value is OutputFormat {
  return OutputFormats.includes(value as OutputFormat);
}

export function sopsGetOutputFormat(outputType: string): OutputFormat {
  if (sopsIsOutputFormat(outputType)) {
    return outputType;
  }
  if (!outputType) {
    coreInfo("No output_type selected, Defaulting to json");
    return "json";
  }

  throw new Error(`Output type "${outputType}" is not supported by sops-decrypt`);
}
