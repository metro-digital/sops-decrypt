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

import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import * as path from 'path'
import * as command from './command'

const toolName = 'sops'

export enum OutputFormat {
  JSON = 'json',
  YAML = 'yaml',
  DOTENV = 'dotenv'
}

export async function decrypt (sops: string, secretFile: string, outputType: string) {
  const sopsArgs: string[] = []
  sopsArgs.push('--decrypt')
  sopsArgs.push('--output-type', outputType)
  sopsArgs.push(secretFile)
  core.info(`Decrypting the secrets to ${outputType} format`)
  const result = await command.exec(sops, sopsArgs)
  if (!result.status) {
    core.info('Unable to decrypt the secrets')
    throw new Error(`Execution of sops command failed on ${secretFile}: ${result.error}`)
  }

  core.info('Successfully decrypted the secrets')
  return result.output
}

export async function install (version: string, chmod: (path: string, mode: string) => void) {
  const extension = process.platform === 'win32' ? '.exe' : ''
  const url = downloadURL(version)
  const binaryPath = await download(version, extension, url)
  chmod(binaryPath, '777')
  core.addPath(path.dirname(binaryPath))
  return binaryPath
}

export function downloadURL (version: string) {
  version = version.startsWith('v') ? version.slice(1) : version
  const isHigherVersion = isVersionGreaterThan371(version)
  const extension = process.platform === 'win32' ? 'exe' : process.platform

  if (isHigherVersion && extension !== 'exe') {
    let arch = process.arch.toString()
    if (arch === 'x64') {
      arch = 'amd64'
    }

    return `https://github.com/getsops/sops/releases/download/v${version}/sops-v${version}.${extension}.${arch}`
  }

  return `https://github.com/getsops/sops/releases/download/v${version}/sops-v${version}.${extension}`
}

export function isVersionGreaterThan371 (version: string) {
  const versionParts = version.split('.')
  const major = parseInt(versionParts[0])
  const minor = parseInt(versionParts[1])
  const patch = parseInt(versionParts[2])

  if (major > 3 || (major === 3 && minor > 7) || (major === 3 && minor === 7 && patch > 1)) {
    return true
  }

  return false
}

export async function download (version: string, extension:string, url: string) {
  let cachedToolpath = toolCache.find(toolName, version)
  if (!cachedToolpath) {
    core.debug(`Downloading ${toolName} from: ${url}`)

    let downloadedToolPath: string
    try {
      downloadedToolPath = await toolCache.downloadTool(url)
    } catch (error: unknown) {
      core.debug((error as Error).message)
      throw new Error(`Failed to download version ${version}: ${error}`)
    }

    cachedToolpath = await toolCache.cacheFile(
      downloadedToolPath,
      toolName + extension,
      toolName,
      version
    )
  }

  const executablePath = path.join(
    cachedToolpath,
    toolName + extension
  )

  return executablePath
}

function isOutputFormat (value: string): value is OutputFormat {
  return Object.values(OutputFormat).includes(value as OutputFormat)
}

export function getOutputFormat (outputType: string): OutputFormat {
  if (isOutputFormat(outputType)) {
    return outputType
  } else if (!outputType) {
    core.info('No output_type selected, Defaulting to json')
    return OutputFormat.JSON
  }

  throw new Error(`Output type "${outputType}" is not supported by sops-decrypt`)
}
