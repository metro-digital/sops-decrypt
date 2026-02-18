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

import { describe, expect, it } from 'vitest'
import { sopsIsVersionGreaterThan371 } from '../../src/sops.js'

describe('When checking for higher versions of SOPS', () => {
  it('should return false for version 3.6.1', () => {
    const version = '3.6.1'
    const expected = false

    const actual = sopsIsVersionGreaterThan371(version)

    expect(actual).toEqual(expected)
  })

  it('should return false for version v3.7.1', () => {
    const version = '3.7.1'
    const expected = false

    const actual = sopsIsVersionGreaterThan371(version)

    expect(actual).toEqual(expected)
  })

  it('should return true for version v3.8.0', () => {
    const version = '3.8.0'
    const expected = true

    const actual = sopsIsVersionGreaterThan371(version)

    expect(actual).toEqual(expected)
  })

  it('should return true for version v3.8.0-rc.1', () => {
    const version = '3.8.0-rc.1'
    const expected = true

    const actual = sopsIsVersionGreaterThan371(version)

    expect(actual).toEqual(expected)
  })
})