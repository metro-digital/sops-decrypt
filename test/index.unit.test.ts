import * as sops from '../src/index';

describe('When getting the download URL for SOPS', () => {
  let originalPlatform: string
  beforeEach(() => {
      originalPlatform = process.platform;
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  it('should get the right URL for windows platform', () => {
    const version = '3.6.1';
    setPlatform('win32')
    let expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.exe`

    let actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })

  it('should get the right URL for linux platform', () => {
    const version = '3.6.1';
    setPlatform('linux')
    let expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.linux`

    let actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })

  it('should get the right URL for darwin platform', () => {
    const version = '3.6.1';
    setPlatform('darwin')
    let expectedURL = `https://github.com/mozilla/sops/releases/download/v${version}/sops-v${version}.darwin`

    let actualURL = sops.downloadURL(version)

    expect(actualURL).toEqual(expectedURL)
  })
})

function setPlatform(platform:string) {
  Object.defineProperty(process, 'platform', {
    value: platform
  });
}
