const webpackConfig = require('./webpack-config/webpack.base.config');
const {
  baseDir,
  clientDir,
  serverDir,
  outDir,
  appGlobals,
  appTsConfigFile,
  testTsConfigFile,
} = require('./project.config');
const {
  replaceBackslash,
  relativeToBase: utilsRelativeToBase,
} = require('./config-utils');

const relativeToBase = utilsRelativeToBase.bind(null, baseDir);

const clientGlobals = Object.keys(appGlobals).reduce((acc, global) => {
  acc[global] = 'readonly';
  return acc;
}, {});

const relativeServerDir = replaceBackslash(relativeToBase(serverDir));
const relativeClientDir = replaceBackslash(relativeToBase(clientDir));
const relativeOutDir = replaceBackslash(relativeToBase(outDir));

const relativeAppTsConfig = replaceBackslash(relativeToBase(appTsConfigFile));
const relativeTestTsConfig = replaceBackslash(relativeToBase(testTsConfigFile));

const jsConfig = {
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    es2020: true,
    browser: true,
    node: false,
  },
  globals: clientGlobals,
  plugins: ['import'],
  extends: [
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    // TODO: eslint-plugin-jsx-a11y

    // Disable eslint-plugin-react and rules that can conflict with prettier.
    'prettier/react',
  ],
  rules: {
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: false,
      },
    ],
    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: true,
        beforeLineComment: true,
        allowBlockStart: true,
        allowBlockEnd: true,
        allowObjectStart: true,
        allowObjectEnd: true,
        allowArrayStart: true,
        allowArrayEnd: true,
        allowClassStart: true,
        allowClassEnd: true,
      },
      // TODO: import/no-cycle should (but does not) handle webpack aliases
      // 'import/no-cycle': 2,
    ],
  },
  settings: {
    'import/resolver': {
      webpack: {
        config: webpackConfig,
      },
    },
    react: {
      pragma: 'React',
      version: 'detect',
    },
    propWrapperFunctions: [
      // The names of any function used to wrap propTypes, e.g. `forbidExtraProps`.
      // If this isn't set, any propTypes wrapped in a function will be skipped.
    ],
    linkComponents: [
      // Components used as alternatives to <a> for linking, eg. <Link to={ url } />.
    ],
  },
};

const tsConfig = {
  ...jsConfig,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [relativeAppTsConfig, relativeTestTsConfig],
  },
  plugins: [...jsConfig.plugins, '@typescript-eslint'],
  extends: [
    ...jsConfig.extends,
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // Disable rules that can conflict with prettier.
    'prettier/@typescript-eslint',
  ],
  rules: {
    ...jsConfig.rules,
    '@typescript-eslint/ban-ts-comment': [
      2,
      {
        'ts-expect-error': false,
      },
    ],
    'react/prop-types': [0],
  },
};

module.exports = {
  root: true,
  ignorePatterns: ['node_modules/**/*', `${relativeOutDir}/**/*`, '**/*.d.ts'],
  parserOptions: {
    ecmaVersion: 2018,
  },
  env: {
    es2017: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'prettier', // disable general eslint rules that can conflict with prettier
  ],
  overrides: [
    {
      ...jsConfig,
      files: [`${relativeClientDir}/**/*.@(js|mjs|jsx)`],
    },
    {
      ...tsConfig,
      files: [`${relativeClientDir}/**/*.@(ts|tsx)`],
    },
    {
      files: [`${relativeServerDir}/**/*.@(js|mjs)`],
    },
  ],
};
