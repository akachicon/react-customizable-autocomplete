const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const { CleanWebpackPlugin: CleanPlugin } = require('clean-webpack-plugin');
const ExtractCssChunksPlugin = require('extract-css-chunks-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const FaviconsPlugin = require('favicons-webpack-plugin');
const postcssMediaMinmax = require('postcss-media-minmax');
const postcssAutoprefixer = require('autoprefixer');
const postcssCssnano = require('cssnano');
const regexEscape = require('regex-escape');
const { html } = require('../project.config');
const htmlPluginOptions = require('./config-parts/html-webpack-plugin-options');
const {
  add: addToFileLoaderStore,
} = require('./config-parts/file-loader-store');

const {
  baseDir,
  clientDir,
  outDir,
  pathAliases,
  publicPath,
  appEntry,
  appGlobals,
  runtimeChunkName,
  fontFaceChunkName,
  cssExtRegexString,
  enableCssModules,
  faviconPrefix,
  env,
} = require('../project.config.js');

const bootstrapEntry = path.resolve(clientDir, 'bootstrap.js');
const escapedAtStylesPath = regexEscape(pathAliases['@styles']);
const fontFaceRegex = new RegExp(
  `${escapedAtStylesPath}\\${path.sep}fonts${cssExtRegexString}`
);

module.exports = {
  mode: 'none',
  context: baseDir,
  entry: {
    main: [bootstrapEntry, appEntry],
  },
  output: {
    path: outDir,
    publicPath: publicPath,
    filename: '[name].js',
    chunkFilename: '[name].js',
    crossOriginLoading: 'anonymous',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.scss', '.css'],
    alias: pathAliases,
  },
  module: {
    rules: [
      {
        test: /\.[j,t]sx?$/i,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: env.dev,
        },
      },
      {
        test: new RegExp(cssExtRegexString, 'i'),
        use: [
          // Use style-loader for dev because of better support for css-modules hmr.
          env.dev
            ? {
                loader: 'style-loader',
                options: {
                  esModule: true,
                },
              }
            : {
                loader: ExtractCssChunksPlugin.loader,
                options: {
                  esModule: true,
                },
              },
          {
            loader: 'css-loader',
            options: {
              sourceMap: env.dev,
              esModule: true,
              importLoaders: 2, // postcss-loader, sass-loader
              modules: enableCssModules
                ? {
                    mode: (resourcePath) => {
                      const getModeRegex = (mode) =>
                        new RegExp(
                          `\\.${regexEscape(mode)}${cssExtRegexString}`
                        );

                      const testResourceForMode = (resource, mode) =>
                        getModeRegex(mode).test(resource);

                      if (testResourceForMode(resourcePath, 'pure')) {
                        return 'pure';
                      }
                      if (
                        testResourceForMode(resourcePath, 'global') ||
                        resourcePath.match(escapedAtStylesPath)
                      ) {
                        return 'global';
                      }
                      return 'local';
                    },
                    exportGlobals: true,
                    localIdentName: env.prod
                      ? '[hash:base64:8]'
                      : '[path]__[name]__[local]',
                  }
                : false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: env.dev,
              plugins: [
                postcssMediaMinmax(),
                ...(env.prod
                  ? [
                      postcssAutoprefixer({
                        remove: false,
                      }),
                      postcssCssnano(),
                    ]
                  : []),
              ],
            },
          },
          {
            loader: 'resolve-url-loader',
            options: {
              sourceMap: env.dev,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                // source maps are necessary for resolve-url-loader to work
                sourceMap: true,
                // speed up dart-sass compilation using fibers according to the docs
                fiber: require('fibers'),
              },
            },
          },
        ],
      },
      {
        test: /\.(woff2|woff|ttf|otf|eot)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: env.dev ? '[name].[ext]' : '[name].[contenthash:6].[ext]',
              outputPath: 'fonts',
              afterEach: env.prod ? addToFileLoaderStore : () => {},
            },
          },
        ],
      },
      {
        test: /\.(jpe?g|png|webp|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: env.dev ? '[name].[ext]' : '[name].[contenthash:6].[ext]',
              outputPath: 'images',
              limit: 8 * 1024, // 8kb
              afterEach: env.prod ? addToFileLoaderStore : () => {},
            },
          },
        ],
      },
    ],
  },
  optimization: {
    noEmitOnErrors: env.dev,
    moduleIds: env.dev ? 'named' : 'hashed',
    chunkIds: env.dev ? 'named' : false, // enable for dev mode; use HashedChunkIds plugin for other environments
    runtimeChunk: {
      name: () => runtimeChunkName,
    },
    splitChunks: {
      chunks: 'all',
      minSize: 1024 * 30, // 30kb
      maxSize: 1024 * 200, // 100kb
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        vendors: false,
        default: false,
        [fontFaceChunkName]: {
          // TODO: find a way to exclude font-face chunk from js chunks
          // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85
          // https://github.com/webpack/webpack/issues/7300
          test: env.prod ? fontFaceRegex : () => false,
          name: () => fontFaceChunkName,
          priority: 20,
          enforce: true, // ignore minSize, maxInitialRequests, and maxAsyncRequests
        },
        styles: {
          test: new RegExp(cssExtRegexString),
          priority: 10,
        },
        vendor: {
          test: /\/node_modules\//,
          priority: -10,
        },
        common: {
          reuseExistingChunk: true,
          priority: -20,
        },
      },
    },
  },
  plugins: [
    new FriendlyErrorsPlugin(),
    new CleanPlugin(),
    new webpack.DefinePlugin({
      ...appGlobals,
    }),
    new ExtractCssChunksPlugin({
      // To allow font-face declaration embedding via style-ext-html-webpack-plugin
      // we should specify [name] cause the plugin uses file name to match against.

      // moduleFilename: (chunkData) => (
      //   chunkData.chunk.name === fontFaceChunkName
      //     ? '[name].[id].[contenthash:8].css'
      //     : '[id].[contenthash:8].css'
      // )

      // At the time moduleFilename doesn't work, so we use chunkFilename string
      // (cause this option doesn't allow function value) with [id] placeholder.
      // The id for the font-face chunk will be set as fontFaceChunkName (by
      // hashed-chunk-ids-webpack-plugin).
      chunkFilename: env.dev ? '[name].css' : '[id].[contenthash:8].css',
    }),
    new HtmlPlugin(htmlPluginOptions),
    new FaviconsPlugin({
      logo: html.favicon,
      prefix: faviconPrefix,
      favicons: {
        appName: html.title,
        icons: {
          android: false,
          appleIcon: false,
          appleStartup: false,
          coast: false,
          favicons: true,
          firefox: true,
          windows: true,
          yandex: false,
        },
      },
    }),
  ],
};
