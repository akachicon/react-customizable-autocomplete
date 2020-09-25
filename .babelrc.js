const isDev = process.env.NODE_ENV === 'development';
const isUmd = process.env.MODULE_FORMAT === 'umd';

module.exports = {
  plugins: [
    '@babel/proposal-class-properties',
    [
      '@babel/transform-runtime',
      {
        regenerator: false,
        useESModules: true,
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
      '@babel/preset-env',
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
      '@babel/preset-react',
      {
        runtime: 'classic',
        development: isDev,
      },
    ],
    [
      '@babel/preset-typescript',
      {
        allowDeclareFields: true,
        onlyRemoveTypeImports: true,
      },
    ],
  ],
};
