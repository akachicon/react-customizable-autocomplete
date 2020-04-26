const { htmlFilename, html, env } = require('../../project.config');

const { title, template, templateParameters } = html;

// noinspection WebpackConfigHighlighting
module.exports = {
  template,
  templateParameters,
  title,
  filename: env.prod ? `[contenthash:8].${htmlFilename}` : htmlFilename,
  showErrors: !env.prod,
  minify: env.prod,
  cache: true, // to allow hmr with script inliner
  cacheIgnore: [/.+\.hot-update\.js$/i],
};
