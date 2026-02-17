require('esbuild').build({
  entryPoints: ['./src/main.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  sourcemap: false,
  banner: {
    js: `import { createRequire } from "node:module";
let require = createRequire(import.meta.url);
`
  }
})

require('esbuild').build({
  entryPoints: ['./src/post-action.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/post-action/index.js',
  sourcemap: false,
  banner: {
    js: `import { createRequire } from "node:module";
let require = createRequire(import.meta.url);
`
  }
})