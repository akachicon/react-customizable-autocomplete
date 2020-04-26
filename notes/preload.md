## file-loader preload problem

Currently, html-webpack-plugin does not expose resources processed by file-loader as its 
asset tags when a resource included in either js or css imports. This makes it impossible 
to use html-webpack-plugin to preload the assets.

At the time of writing mini-css-extract-plugin has a dedicated [issue](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/457).

## Solution

We can extend file-loader with afterEach callback option so that it would be possible to 
accumulate generated paths. This, however, can only be used in production mode because of 
the following limitations.

## Limitations

- Multiple page compilation - you cannot compile multiple html pages with the suggested logic 
at once, cause every page will get tags from all the pages, possible solution - some regexp 
option to handle different pages. 

- Removing asset - if an asset removed the store wouldn't be updated (in case of watch or hmr mode).

- Caching asset - on recompile a path for a cached resource won't be added (cause there is no loader 
function call), possible solution - ```cacheable: false``` for the loader.
