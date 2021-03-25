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
import * as actionsExec from '@actions/exec'
import { ExecOptions } from '@actions/exec'

export interface Result {
  status: boolean
  output: string
  error: string
}

export async function exec (command: string, args: string[], stdin?: string) {
  let output: string = ''
  let error: string = ''
  const options: ExecOptions = {
    silent: true,
    ignoreReturnCode: true,
    input: Buffer.from(stdin || '')
  }
  options.listeners = {
    stdout: (data: Buffer) => {
      output += data.toString()
    },
    stderr: (data: Buffer) => {
      error += data.toString()
    }
  }
  const returnCode = await actionsExec.exec(command, args, options)
  const result = {
    status: returnCode === 0,
    output: output.trim(),
    error: error.trim()
  } as Result

  return result
}
