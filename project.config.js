// This file is intended to
//
// - declare the relationships between name pieces which will persist through the app config.
//
// - contain general app data. The file is considered as a convenient place to manage
// general app settings.

const path = require('path');
const join = (...args) => path.join(...args);

const defineGetters = (mappings) =>
  Object.entries(mappings).reduce(
    (acc, [key, val]) =>
      Object.defineProperty(acc, key, {
        configurable: false,
        enumerable: true,
        get: val,
      }),
    {}
  );

const baseDir = __dirname;
const srcDir = join(baseDir, 'src');
const serverDir = join(srcDir, 'server');
const clientDir = join(srcDir, 'client');
const outDir = join(baseDir, 'dist');
const assetDir = join(clientDir, 'assets');
const cacheDir = join(baseDir, 'node_modules', '.cache');

const assetDirJoin = (...files) => join(assetDir, ...files);

const pathAliases = {
  '@': clientDir,
  '@app': join(clientDir, 'app'),
  '@styles': assetDirJoin('styles'),
  '@fonts': assetDirJoin('fonts'),
  '@images': assetDirJoin('images'),
};
// TODO: check win
Object.entries(pathAliases).forEach(([alias, aliasPath]) => {
  pathAliases[alias] = aliasPath.replace(/\\/g, '/');
});

const publicPath = '/';
const appEntry = join(clientDir, 'index.js');
const runtimeChunkName = 'runtime';

// It is expected that @styles contains 'fonts' file
// for webpack to inline it. The file is imported
// in bootstrap.js. To be able to distinguish the
// file for inlining we place it in its own chunk
// with the name of fontFaceChunkName.

// Due to the bug in extract-css-chunks-webpack-plugin
// we can only use chunkFilename (and not moduleFilename)
// option for naming chunks. This option only accepts
// string values. In order to hide module names from
// generated assets we use [id].[contenthash].css value.
// Then we set id for the font-face chunk to be fontFaceChunkName.
// The name is used in regexp, so choose accurately.
const fontFaceChunkName = '__font-face-chunk__';
const fontPreloadRegex = new RegExp(
  '(OpenSans-Bold-latin|OpenSans-Regular-latin).*\\.woff2$'
);
const cssExtRegexString = '\\.s?css$';
const enableCssModules = true;

// Use favicon output prefix path to avoid path rewriting
// with image optimization plugin.
// TODO: check win
const faviconPrefix = 'favicon/';

const htmlFilename = 'index.html'; // output html filename
const html = {
  title: 'THE APP',
  favicon: join(assetDir, 'images', 'favicon.svg'),
  template: join(clientDir, 'index.html'),
  templateParameters: {},
};
const env = defineGetters({
  dev: () => process.env.NODE_ENV === 'development',
  prod: () => process.env.NODE_ENV === 'production',
});
const appGlobals = {
  __DEV__: env.dev,
  __PROD__: env.prod,
};
const devServer = {
  port: 3030,
  clientLogLevel: 'info',
  // watchContentBase will be forced to be true in hmr mode,
  // this way we can reload html automatically.
  watchContentBase: true,
  hot: true,
};
const bundleAnalyzerReportPath = join(baseDir, 'bundle-analyzer.report.html');
const appTsConfigFile = path.join(clientDir, 'composite.app.tsconfig.json');
const testTsConfigFile = path.join(clientDir, 'composite.test.tsconfig.json');

module.exports = {
  baseDir,
  serverDir,
  clientDir,
  outDir,
  cacheDir,
  pathAliases,
  publicPath,
  appEntry,
  appGlobals,
  runtimeChunkName,
  fontFaceChunkName,
  fontPreloadRegex,
  cssExtRegexString,
  enableCssModules,
  faviconPrefix,
  htmlFilename,
  html,
  env,
  devServer,
  bundleAnalyzerReportPath,
  appTsConfigFile,
  testTsConfigFile,
};
