const mimeTypes = require('mime-types');
const { createHtmlTagObject } = require('html-webpack-plugin/lib/html-tags');

const asAttr = {
  woff2: 'font',
  png: 'image',
};

const getExt = (path) => path.slice(path.lastIndexOf('.') + 1);
const getAsAttr = (path) => {
  const ext = getExt(path);
  const attr = asAttr[ext];

  if (!attr) {
    throw new Error(
      `'as' attribute value does not exist for .${ext} extension`
    );
  }
  return attr;
};
const getTypeAttr = (path) => {
  const ext = getExt(path);
  const attr = mimeTypes.lookup(ext);

  if (!attr) {
    throw new Error(
      `'type' attribute value does not exist for .${ext} extension`
    );
  }
  return attr;
};

module.exports = (paths, filters) => {
  const filteredPaths = paths.filter((path) =>
    filters.some((filter) => {
      if (filter instanceof RegExp) {
        return path.match(filter);
      }
      if (typeof filter === 'string') {
        return path === filter;
      }
    })
  );
  return filteredPaths.map((path) => {
    const attrs = {
      rel: 'preload',
      href: path,
      as: getAsAttr(path),
      type: getTypeAttr(path),
    };

    if (attrs.type.split('/')[0] === 'font') {
      attrs.crossorigin = true;
    }
    return createHtmlTagObject('link', attrs);
  });
};
