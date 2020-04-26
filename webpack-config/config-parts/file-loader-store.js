const store = new Set();

exports.getEntries = () => Array.from(store);

exports.add = (loaderCtx, computedPath) => {
  // See preload-notes.md for the explanation.
  store.add(computedPath);
};
