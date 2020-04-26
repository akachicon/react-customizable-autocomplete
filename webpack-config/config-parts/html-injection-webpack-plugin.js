const HtmlWebpackPlugin = require('html-webpack-plugin');

const optionValidators = {
  head(val) {
    if (!Array.isArray(val)) {
      throw new Error('"head" has to be of type Array or unspecified');
    }
  },
  exclude(val) {
    if (!Array.isArray(val)) {
      throw new Error('"exclude" has to be of type Array or unspecified');
    }
  },
  getAdditionalTags(val) {
    if (!(val instanceof Function)) {
      throw new Error(
        '"getAdditionalTags" has to be instance of Function or unspecified'
      );
    }
  },
  postProcessTag(val) {
    if (!(val instanceof Function)) {
      throw new Error(
        '"postProcessTag" has to be instance of Function or unspecified'
      );
    }
  },
};

const validateOptions = (options) =>
  Object.entries(options).forEach(([name, val]) => optionValidators[name](val));

const filterTagsByPath = (tags, filters, hasNoPathFilter = () => false) =>
  tags.filter((tag) => {
    const src = tag.attributes && tag.attributes.src;
    const href = tag.attributes && tag.attributes.href;
    const resourcePath = src || href;

    if (!resourcePath) {
      return hasNoPathFilter(tag);
    }

    return filters.some((filter) => resourcePath.match(filter));
  });

const filterNonPathHeadTags = ({ tagName }) =>
  ['title', 'meta', 'style'].includes(tagName);

// place inline styles at the end
const rearrangeInlineStyles = (tags) => {
  const styleTags = [];
  const nonStyleTags = [];

  for (const tag of tags) {
    tag.tagName === 'style' ? styleTags.push(tag) : nonStyleTags.push(tag);
  }
  return [...nonStyleTags, ...styleTags];
};

// place inline scripts at the end
const rearrangeInlineScripts = (tags) => {
  const inlineScriptTags = [];
  const nonInlineScriptTags = [];

  for (const tag of tags) {
    const isInlineScript =
      tag.tagName === 'script' && !(tag.attributes && tag.attributes.src);

    isInlineScript ? inlineScriptTags.push(tag) : nonInlineScriptTags.push(tag);
  }
  return [...nonInlineScriptTags, ...inlineScriptTags];
};

const rearrangePreloadLinks = (tags) => {
  const preloadLinkTags = [];
  const nonPreloadLinkTags = [];

  for (const tag of tags) {
    tag.tagName === 'link' && tag.attributes && tag.attributes.rel === 'preload'
      ? preloadLinkTags.push(tag)
      : nonPreloadLinkTags.push(tag);
  }
  return [...preloadLinkTags, ...nonPreloadLinkTags];
};

class HtmlWebpackInjectionPlugin {
  constructor({
    head = [],
    exclude = [],
    getAdditionalTags = () => ({ head: [], body: [] }),
    postProcessTag = (tag) => tag,
  } = {}) {
    validateOptions({
      head,
      exclude,
      getAdditionalTags,
      postProcessTag,
    });
    this.head = head;
    this.exclude = exclude;
    this.getAdditionalTags = getAdditionalTags;
    this.postProcessTag = postProcessTag;
  }

  apply(compiler) {
    if (HtmlWebpackPlugin.getHooks) {
      compiler.hooks.compilation.tap(
        'HtmlWebpackInjectionPlugin',
        (compilation) => {
          HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
            'HtmlWebpackInjectionPlugin',
            (data, callback) => {
              const tags = [...data.headTags, ...data.bodyTags];
              const { head: headFilters, exclude: excludeFilters } = this;

              let includedTags = tags;

              if (excludeFilters.length) {
                const excludedTags = filterTagsByPath(tags, excludeFilters);
                const excludedTagsSet = new Set(excludedTags);

                includedTags = tags.filter((tag) => !excludedTagsSet.has(tag));
              }

              // do not check headFilters.length cause we still want to use filterNonPathHeadTags
              let headTags = filterTagsByPath(
                includedTags,
                headFilters,
                filterNonPathHeadTags
              );

              const headTagsSet = new Set(headTags);
              let bodyTags = includedTags.filter(
                (tag) => !headTagsSet.has(tag)
              );
              const additionalTags = this.getAdditionalTags();

              additionalTags.head = additionalTags.head || [];
              additionalTags.body = additionalTags.body || [];

              headTags = [...headTags, ...additionalTags.head];
              headTags = rearrangeInlineStyles(headTags);
              headTags = rearrangePreloadLinks(headTags);

              bodyTags = [...bodyTags, ...additionalTags.body];
              bodyTags = rearrangeInlineScripts(bodyTags);

              data.headTags = headTags.map(this.postProcessTag);
              data.bodyTags = bodyTags.map(this.postProcessTag);

              callback(null, data);
            }
          );
        }
      );
    }
  }
}

module.exports = HtmlWebpackInjectionPlugin;
