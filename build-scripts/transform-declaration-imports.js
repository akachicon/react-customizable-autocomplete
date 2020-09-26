const { readdirSync } = require('fs');
const { join } = require('path');
const replaceInFiles = require('replace-in-files');
const regexEscape = require('regex-escape');

const DIST = 'dist';

const files = readdirSync(DIST)
  .filter((file) => file.match(/\.d\.ts$/))
  .map((file) => join(DIST, file));

const importRegex = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?<path>(?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/gm;

replaceInFiles({
  files,
  from: importRegex,
  to(importString, pathString) {
    const path = pathString.slice(1, -1);
    let pathReplacement = pathString;

    if (path.startsWith('./')) {
      pathReplacement = JSON.stringify('../types/' + path.slice(2));
    }

    return importString.replace(
      new RegExp(regexEscape(pathString)),
      pathReplacement
    );
  },
}).catch(function handleError(err) {
  console.error('[replace-in-files]', err);
  process.exit(1);
});
