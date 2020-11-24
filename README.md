# SOPS Decrypt action

![test suite](https://github.com/metro-digital-inner-source/sops-decrypt/workflows/Tests/badge.svg)

A GitHub action that can be used to decrypt a SOPS encrypted file.

## Inputs

### `version`

**Required** Version of SOPS binary that has to be used to decrypt the file

### `file`

**Required** Relative path to the SOPS encrypted file that has to be decrypted

### `gpg_key`

**Required** Base64 encoded private GPG key that can decrypt the file

## Outputs

### `data`

Decrypted data in JSON format

## Example usage

```yaml
jobs:
  decrypt-secrets:
    runs-on: ubuntu
    steps:
      - uses: metro-digital-inner-source/sops-decrypt
        with:
          version: '3.6.1'
          file: 'ci/secrets/file1.yaml'
          gpg_key: '<private_gpg_key_base64_encoded>'
```
