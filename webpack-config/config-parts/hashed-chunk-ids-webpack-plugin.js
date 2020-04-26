const { createHash } = require('crypto');
const { fontFaceChunkName } = require('../../project.config');

class HashedChunkIdsWebpackPlugin {
  constructor(options) {
    this.options = Object.assign(
      {
        hashFunction: 'md5',
        hashDigest: 'hex',
        hashDigestLength: 4,
      },
      options
    );
  }

  apply(compiler) {
    const options = this.options;
    compiler.hooks.compilation.tap(
      'HashedChunkIdsWebpackPlugin',
      (compilation) => {
        const usedIds = new Set();

        compilation.hooks.beforeChunkIds.tap(
          'HashedChunkIdsWebpackPlugin',
          (chunks) => {
            chunks.forEach((chunk) => {
              if (chunk.id === null) {
                // In extract-css-chunks-webpack-plugin we use [id].[contenthash].css value for
                // chunkFilename. We also want to inline font-face chunk via style-ext-html-webpack-plugin,
                // which uses an asset filename to detect if a chunk should be inlined. For this reason
                // we set id value for the font-face chunk to be fontFaceChunkName. To identify the chunk
                // we use its name property set earlier by SplitChunksPlugin.
                if (chunk.name && chunk.name.includes(fontFaceChunkName)) {
                  chunk.id = fontFaceChunkName;
                  usedIds.add(chunk.id);

                  return;
                }

                let modules = [];

                if (chunk.getModules) {
                  modules = chunk.getModules();
                } else if (chunk.modules) {
                  modules = chunk.modules;
                }

                let moduleIds = '';

                modules.sort().forEach((iModule) => (moduleIds += iModule.id));

                const hash = createHash(options.hashFunction);

                hash.update(moduleIds);

                const hashId = hash.digest(options.hashDigest);
                let len = options.hashDigestLength;

                while (usedIds.has(hashId.slice(0, len))) {
                  len++;
                }
                chunk.id = hashId.slice(0, len);
                usedIds.add(chunk.id);
              }
            });
          }
        );
      }
    );
  }
}

module.exports = HashedChunkIdsWebpackPlugin;
