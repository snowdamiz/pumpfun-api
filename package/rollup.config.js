import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'path',
  'url',
  'fs',
  'crypto',
  'stream',
  'util',
  'buffer',
  'events',
  'http',
  'https',
  'net',
  'tls',
  'zlib',
  'os',
  'child_process',
  'cluster',
  'worker_threads',
  'timers',
  'async_hooks',
  'perf_hooks',
  'trace_events',
  'wasi',
  'readline',
  'repl',
  'v8',
  'inspector',
  'vm',
  'querystring',
  'url',
  'string_decoder'
];

const baseConfig = {
  external,
  output: {
    sourcemap: true,
    globals: {
      'axios': 'axios',
      'ws': 'WebSocket'
    }
  }
};

export default [
  // Main ESM build
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      ...baseConfig.output,
      file: pkg.module || pkg.exports['.'].import,
      format: 'es'
    },
    plugins: [
      nodeResolve({
        preferBuiltins: false,
        extensions: ['.js', '.ts']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
        moduleResolution: 'node'
      })
    ]
  },

  // CJS build
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      ...baseConfig.output,
      file: pkg.main || pkg.exports['.'].require,
      format: 'cjs',
      exports: 'named'
    },
    plugins: [
      nodeResolve({
        preferBuiltins: false,
        extensions: ['.js', '.ts']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
        moduleResolution: 'node'
      })
    ]
  },

  // Utils ESM build (subpath export)
  {
    ...baseConfig,
    input: 'src/utils/index.ts',
    output: {
      ...baseConfig.output,
      file: 'dist/utils/index.esm.js',
      format: 'es'
    },
    plugins: [
      nodeResolve({
        preferBuiltins: false,
        extensions: ['.js', '.ts']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
        moduleResolution: 'node'
      })
    ]
  },

  // Utils CJS build (subpath export)
  {
    ...baseConfig,
    input: 'src/utils/index.ts',
    output: {
      ...baseConfig.output,
      file: 'dist/utils/index.js',
      format: 'cjs',
      exports: 'named'
    },
    plugins: [
      nodeResolve({
        preferBuiltins: false,
        extensions: ['.js', '.ts']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
        moduleResolution: 'node'
      })
    ]
  },

  // Client ESM build (subpath export)
  {
    ...baseConfig,
    input: 'src/client/index.ts',
    output: {
      ...baseConfig.output,
      file: 'dist/client/index.esm.js',
      format: 'es'
    },
    plugins: [
      nodeResolve({
        preferBuiltins: false,
        extensions: ['.js', '.ts']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
        moduleResolution: 'node'
      })
    ]
  },

  // Client CJS build (subpath export)
  {
    ...baseConfig,
    input: 'src/client/index.ts',
    output: {
      ...baseConfig.output,
      file: 'dist/client/index.js',
      format: 'cjs',
      exports: 'named'
    },
    plugins: [
      nodeResolve({
        preferBuiltins: false,
        extensions: ['.js', '.ts']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
        moduleResolution: 'node'
      })
    ]
  },

  // Type definitions
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    external,
    plugins: [
      dts({
        tsconfig: './tsconfig.build.json'
      })
    ]
  },

  // Utils type definitions (subpath export)
  {
    input: 'src/utils/index.ts',
    output: {
      file: 'dist/utils/index.d.ts',
      format: 'es'
    },
    external,
    plugins: [
      dts({
        tsconfig: './tsconfig.build.json'
      })
    ]
  },

  // Client type definitions (subpath export)
  {
    input: 'src/client/index.ts',
    output: {
      file: 'dist/client/index.d.ts',
      format: 'es'
    },
    external,
    plugins: [
      dts({
        tsconfig: './tsconfig.build.json'
      })
    ]
  }
];