import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";

export async function createTmpDir() {
  const ostmpdir = os.tmpdir();
  const tmpdir = path.join(ostmpdir, "unit-test-");
  return await fs.mkdtemp(tmpdir);
}
