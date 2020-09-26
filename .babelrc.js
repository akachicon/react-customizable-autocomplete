const isDev = process.env.NODE_ENV === 'development';
const isUmd = process.env.MODULE_FORMAT === 'umd';
const isEs = process.env.MODULE_FORMAT === 'es';

module.exports = {
  plugins: [
    '@babel/proposal-class-properties',
    [
      '@babel/transform-runtime',
      {
        regenerator: false,
        useESModules: isEs,
        helpers: !isUmd,
        version: '^7.11.6',
      },
    ],
    [
      'polyfill-corejs3',
      {
        method: 'usage-pure',
        exclude: [/promise/],
        targets: { ie: 11 },
      },
    ],
  ],
  presets: [
    [
      '@babel/env',
      {
        targets: {
          ie: 11,
        },
        bugfixes: true,
        modules: false,
        loose: true,
      },
    ],
    [
      '@babel/react',
      {
        runtime: 'classic',
        development: isDev,
      },
    ],
    [
      '@babel/typescript',
      {
        allowDeclareFields: true,
        onlyRemoveTypeImports: true,
      },
    ],
  ],
};
