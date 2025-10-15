import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { createRequire } from 'module';
import path from 'path';
import terser from '@rollup/plugin-terser';

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
  },
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    unknownGlobalSideEffects: false,
    tryCatchDeoptimization: false
  }
};

const createPlugins = ({ includeTerser = true, isTypes = false }) => {
  const plugins = [
    nodeResolve({
      preferBuiltins: false,
      extensions: ['.js', '.ts'],
      browser: false
    }),
    commonjs(),
  ];

  if (!isTypes) {
    plugins.push(
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
        moduleResolution: 'node',
        sourceMap: true,
        inlineSources: false
      })
    );

    if (includeTerser) {
      plugins.push(
        terser({
          format: {
            comments: false,
            preamble: `/*! PumpFun API Client v${pkg.version} | ${(new Date()).toISOString().split('T')[0]} */`
          },
          compress: {
            drop_console: false,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'],
            passes: 2,
            unsafe: true,
            unsafe_comps: true,
            unsafe_Function: true,
            unsafe_math: true,
            unsafe_proto: true,
            unsafe_regexp: true
          },
          mangle: {
            reserved: ['PumpFunAPIClient', 'LiveCoin', 'StreamClip', 'LiveStreamInfo'],
            toplevel: false
          }
        })
      );
    }
  } else {
    plugins.push(
      dts({
        tsconfig: './tsconfig.build.json',
        respectExternal: true
      })
    );
  }

  return plugins;
};

export default [
  // Main ESM build (minified)
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      ...baseConfig.output,
      file: pkg.module || pkg.exports['.'].import,
      format: 'es'
    },
    plugins: createPlugins({ includeTerser: true })
  },

  // CJS build (minified)
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      ...baseConfig.output,
      file: pkg.main || pkg.exports['.'].require,
      format: 'cjs',
      exports: 'named'
    },
    plugins: createPlugins({ includeTerser: true })
  },

  // Utils ESM build (minified)
  {
    ...baseConfig,
    input: 'src/utils/index.ts',
    output: {
      ...baseConfig.output,
      file: 'dist/utils/index.esm.js',
      format: 'es'
    },
    plugins: createPlugins({ includeTerser: true })
  },

  // Utils CJS build (minified)
  {
    ...baseConfig,
    input: 'src/utils/index.ts',
    output: {
      ...baseConfig.output,
      file: 'dist/utils/index.js',
      format: 'cjs',
      exports: 'named'
    },
    plugins: createPlugins({ includeTerser: true })
  },

  // Client ESM build (minified)
  {
    ...baseConfig,
    input: 'src/client/index.ts',
    output: {
      ...baseConfig.output,
      file: 'dist/client/index.esm.js',
      format: 'es'
    },
    plugins: createPlugins({ includeTerser: true })
  },

  // Client CJS build (minified)
  {
    ...baseConfig,
    input: 'src/client/index.ts',
    output: {
      ...baseConfig.output,
      file: 'dist/client/index.js',
      format: 'cjs',
      exports: 'named'
    },
    plugins: createPlugins({ includeTerser: true })
  },

  // Type definitions
  {
    ...baseConfig,
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    external,
    plugins: createPlugins({ includeTerser: false, isTypes: true })
  },

  // Utils type definitions
  {
    ...baseConfig,
    input: 'src/utils/index.ts',
    output: {
      file: 'dist/utils/index.d.ts',
      format: 'es'
    },
    external,
    plugins: createPlugins({ includeTerser: false, isTypes: true })
  },

  // Client type definitions
  {
    ...baseConfig,
    input: 'src/client/index.ts',
    output: {
      file: 'dist/client/index.d.ts',
      format: 'es'
    },
    external,
    plugins: createPlugins({ includeTerser: false, isTypes: true })
  }
];