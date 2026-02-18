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
import * as actionsExec from "@actions/exec";
import type { ExecOptions } from "@actions/exec";
import * as core from "@actions/core";

export interface Result {
  status: boolean;
  output: string;
  error: string;
}

export async function exec(command: string, args: string[], stdin?: string) {
  let output = Buffer.from([]);
  let error = Buffer.from([]);
  const options: ExecOptions = {
    silent: true,
    ignoreReturnCode: true,
    input: Buffer.from(stdin || ""),
  };
  options.listeners = {
    stdout: (data: Buffer) => {
      output = Buffer.concat([output, data]);
    },
    stderr: (data: Buffer) => {
      error = Buffer.concat([error, data]);
    },
  };

  core.info(`Executing the ${command} command`);
  try {
    const returnCode = await actionsExec.exec(command, args, options);
    const result: Result = {
      status: returnCode === 0,
      output: output.toString().trim(),
      error: error.toString().trim(),
    };
    core.info(`Executed the ${command} command`);
    return result;
  } catch (e: unknown) {
    const result: Result = {
      status: false,
      output: output.toString().trim(),
      error: (e as Error).message,
    };
    core.error(`Executed and failed the ${command} command`);
    return result;
  }
}
