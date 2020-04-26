const path = require('path');

const replaceBackslash = (str) => str.replace(/\\/g, '/');

const relativeToBase = (baseDir, argPath) => {
  const isBaseDirAbsolute = path.isAbsolute(baseDir);
  const isArgPathAbsolute = path.isAbsolute(argPath);

  if (!isBaseDirAbsolute) {
    throw new Error('base directory has to be absolute');
  }
  if (!isArgPathAbsolute) {
    throw new Error('argument path has to be absolute');
  }
  return path.relative(baseDir, argPath);
};

module.exports = {
  replaceBackslash,
  relativeToBase,
};
