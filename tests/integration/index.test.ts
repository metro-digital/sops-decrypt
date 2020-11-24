import * as gpg from '../../src/gpg';
import * as gpg_keys from '../fixtures/gpg_private_keys'

describe('When deleting the gpg key', () => {
  it('should be able to get the fingerprint of the key passed', async ()=>{
    let expectedFPR = "B4226A1192494789A9402116A344AC03500C6401"
    let actualFPR = await gpg.fingerprint(gpg_keys.base64_private_key1)

    expect(actualFPR).toEqual(expectedFPR)
  })
})
