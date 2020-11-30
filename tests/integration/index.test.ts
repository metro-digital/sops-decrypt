import * as gpg from '../../src/gpg';
import * as gpg_keys from '../fixtures/gpg_private_keys'

describe('When deleting the gpg key', () => {
  beforeEach(async()=>{
    await gpg.import_key(gpg_keys.base64_private_key1)
  })

  it('should be able to get the fingerprint of the key passed', async ()=>{
    let expectedFPR = "B4226A1192494789A9402116A344AC03500C6401"
    let actualFPR = await gpg.get_fingerprint(gpg_keys.base64_private_key1)

    expect(actualFPR).toEqual(expectedFPR)
  })

  it('should delete the key without an error', async ()=>{
    await expect(gpg.delete_key(gpg_keys.base64_private_key1)).resolves.not.toThrow();
  })
})
