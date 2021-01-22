import * as gpg from '../../src/gpg';
import * as gpg_keys from '../fixtures/gpg_private_keys'

describe('When deleting the gpg key', () => {
  beforeEach(async()=>{
    await gpg.import_key(gpg_keys.base64_private_key1)
  })

  it('should be able to get the fingerprint of the key passed', async ()=>{
    let expectedFPR = gpg_keys.private_key1_fpr
    let actualFPR = await gpg.get_fingerprint(gpg_keys.base64_private_key1)

    expect(actualFPR).toEqual(expectedFPR)
  })

  it('should delete the key without an error', async ()=>{
    await expect(gpg.delete_key(gpg_keys.private_key1_fpr)).resolves.not.toThrow();
  })
})

describe('When checking for the existence of the gpg key', () => {
  describe('when gpg key exists', ()=>{
    beforeEach(async()=>{
      await gpg.import_key(gpg_keys.base64_private_key1)
    })

    afterEach(async()=>{
      await(gpg.delete_key(gpg_keys.private_key1_fpr))
    })

    it('should return true ', async ()=>{
      let actual = await gpg.key_exists(gpg_keys.private_key1_fpr)

      expect(actual).toBeTruthy()
    })
  })

  describe('when gpg key does not exist', ()=>{
    it('should return false', async ()=>{
      let actual = await gpg.key_exists(gpg_keys.private_key1_fpr)

      expect(actual).not.toBeTruthy()
    })
  })
})
