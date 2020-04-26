// To maintain single source of truth for options like webpack aliases and have
// an ability to config project wide options from a single top level file we
// should pass our options from that config file to tsconfig. Since tsconfig
// does only supports .json extension, we resort to writing tsconfig.json
// generator.

const fs = require('fs');
const path = require('path');
const {
  baseDir,
  cacheDir,
  pathAliases,
  appTsConfigFile,
  testTsConfigFile,
} = require('./project.config');
const {
  replaceBackslash,
  relativeToBase: utilsRelativeToBase,
} = require('./config-utils');

const relativeToBase = utilsRelativeToBase.bind(null, baseDir);

// TODO: check win
const solutionTsBuildInfoDir = replaceBackslash(
  relativeToBase(path.join(cacheDir, 'ts-build-info'))
);
const srcTsBuildInfoDir = replaceBackslash(
  utilsRelativeToBase(
    path.dirname(appTsConfigFile),
    path.join(cacheDir, 'ts-build-info')
  )
);
const typeRootsDir = replaceBackslash(
  utilsRelativeToBase(
    path.dirname(appTsConfigFile),
    path.join(baseDir, 'node_modules', '@types')
  )
);

const relativeAppTsConfig = replaceBackslash(relativeToBase(appTsConfigFile));
const relativeTestTsConfig = replaceBackslash(relativeToBase(testTsConfigFile));

const join = (...args) => path.join(...args);

const solutionConfig = {
  include: [],
  files: [],
  exclude: ['node_modules'],
  references: [{ path: relativeAppTsConfig }, { path: relativeTestTsConfig }],
  compilerOptions: {
    incremental: true,
    composite: true,
    tsBuildInfoFile: join(solutionTsBuildInfoDir, 'solution'),
  },
};

const normalizedPaths = {};

Object.entries(pathAliases).forEach(([alias, aliasPath]) => {
  // TODO: check win
  const normalizedAlias = path.normalize(alias + '/');
  const normalizedAliasPath = path.normalize(relativeToBase(aliasPath) + '/');

  normalizedPaths[normalizedAlias + '*'] = [normalizedAliasPath + '*'];
});

const baseConfig = {
  // declarations supposed to be in the dir along with the config.
  include: ['declarations/**/*.d.ts'],
  references: [],
  compilerOptions: {
    incremental: true,
    composite: true,
    emitDeclarationOnly: true,
    isolatedModules: true,
    jsx: 'preserve',

    // babel@7.8 default
    lib: ['dom', 'dom.iterable', 'esnext'],

    // Though it is deprecated it solves the 'csstype' issue after installing it:
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/24788
    moduleResolution: 'node',

    strict: true,

    // webpack adhere to this behaviour by default
    allowSyntheticDefaultImports: true,

    // When using `moduleResolution: 'node'` (either explicitly or implicitly,
    // https://www.typescriptlang.org/tsconfig#moduleResolution) a non-relative
    // file will be searched in node_modules if there is no such file relative
    // to the baseUrl. For further reading:
    // https://github.com/microsoft/TypeScript/issues/31869
    baseUrl: '.',
    paths: normalizedPaths,
    typeRoots: [typeRootsDir],
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
  },
};

const appConfig = {
  ...baseConfig,
  include: [...baseConfig.include, `**/*.ts`, `**/*.tsx`],
  exclude: ['**/*.spec.ts', '**/*.spec.tsx'],
  compilerOptions: {
    ...baseConfig.compilerOptions,
    baseUrl: utilsRelativeToBase(path.dirname(appTsConfigFile), baseDir),
    tsBuildInfoFile: join(srcTsBuildInfoDir, 'app'),
  },
};

const testConfig = {
  ...baseConfig,
  include: [
    ...baseConfig.include,
    `**/*.spec.ts`,
    `**/*.spec.tsx`,

    // Importing modules from a referenced project will not load their
    // input declaration files.
    `**/*.d.ts`,
  ],
  references: [{ path: appTsConfigFile }],
  compilerOptions: {
    ...baseConfig.compilerOptions,
    baseUrl: utilsRelativeToBase(path.dirname(testTsConfigFile), baseDir),
    tsBuildInfoFile: join(srcTsBuildInfoDir, 'test'),
  },
};

const getConfigString = (conf) => JSON.stringify(conf, undefined, 2) + '\n';

fs.writeFileSync('tsconfig.json', getConfigString(solutionConfig));
fs.writeFileSync(appTsConfigFile, getConfigString(appConfig));
fs.writeFileSync(testTsConfigFile, getConfigString(testConfig));
