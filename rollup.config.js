import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

const isProd = process.env.NODE_ENV === 'production';

const resolveOptions = {
  extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs'],
};

function getPlugins(babelOptions) {
  return [
    resolve(resolveOptions),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    babel(babelOptions),
    isProd && terser(),
  ];
}

const baseConfig = {
  input: './lib/index.tsx',
  external: [
    /@babel\/runtime/,
    /core-js-pure\//,
    'react',
    'react-dom',
    'react-use-batched-state',
  ],
  plugins: getPlugins({
    exclude: /\/node_modules\//,
    extensions: ['.ts', '.tsx'],
    babelHelpers: 'runtime',
  }),
};

const esConfig = {
  ...baseConfig,
  output: {
    format: 'es',
    file: './dist/index.es.js',
    interop: 'auto',
    indent: false,
    sourcemap: !isProd && 'inline',
  },
};

const cjsConfig = {
  ...baseConfig,
  output: {
    format: 'cjs',
    file: './dist/index.cjs.js',
    interop: 'auto',
    exports: 'auto',
    indent: false,
    sourcemap: !isProd && 'inline',
  },
};

const umdConfig = {
  ...baseConfig,

  // No helpers/polyfills in external since they are bundled.
  external: ['react', 'react-dom'],
  plugins: getPlugins({
    exclude: /\/node_modules\//,
    extensions: ['.ts', '.tsx'],
    babelHelpers: 'bundled',
  }),
  output: {
    format: 'umd',
    file: isProd ? './dist/index.umd.min.js' : './dist/index.umd.js',
    name: 'ReactCustomizableAutocomplete',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    interop: 'auto',
    indent: false,
    sourcemap: !isProd && 'inline',
  },
};

const expectedConfig =
  process.env.MODULE_FORMAT === 'es'
    ? esConfig
    : process.env.MODULE_FORMAT === 'cjs'
    ? cjsConfig
    : umdConfig;

export default expectedConfig;
