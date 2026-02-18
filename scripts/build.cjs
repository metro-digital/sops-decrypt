require('esbuild').build({
  entryPoints: ['./src/main.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.js',
  sourcemap: false
})

require('esbuild').build({
  entryPoints: ['./src/post-action.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/post-action/index.js',
  sourcemap: false
})