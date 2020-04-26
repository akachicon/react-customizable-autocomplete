const path = require('path');
const merge = require('webpack-merge');
const { HotModuleReplacementPlugin } = require('webpack');
const { CleanWebpackPlugin: CleanPlugin } = require('clean-webpack-plugin');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const regexEscape = require('regex-escape');
const baseConfig = require('./webpack.base.config.js');
const {
  outDir,
  publicPath,
  htmlFilename,
  devServer,
} = require('../project.config');

const config = merge(baseConfig, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    publicPath,
    contentBase: outDir,
    index: htmlFilename,
    historyApiFallback: true,
    compress: false,
    port: devServer.port || 3030,
    // To reload html automatically in hmr mode we
    // write it to the disk and set watchContentBase to be true.
    watchContentBase: devServer.watchContentBase || devServer.hot,
    hot: devServer.hot,
  },
});

const pluginsToExclude = [];

if (config.devServer.watchContentBase) {
  // Remove CleanPlugin to allow serving prebuilt assets from outDir.
  pluginsToExclude.push(CleanPlugin);
}
if (config.devServer.hot) {
  config.plugins.push(
    new HotModuleReplacementPlugin({
      multistep: true,
    }),
    new ReactRefreshPlugin()
  );
}

config.plugins = config.plugins.filter((plugin) => {
  const exclude = pluginsToExclude.some(
    (excludedPlugin) => plugin instanceof excludedPlugin
  );
  return !exclude;
});

if (config.devServer.hot) {
  config.devServer.writeToDisk = (file) =>
    file.match(`\\${path.sep}${regexEscape(htmlFilename)}$`);
}

module.exports = config;
