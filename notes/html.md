## html-webpack-inline-source-plugin
We cannot rely on this plugin to embed css because the check for the type is like following:

```javascript
    // inline css
    if (tag.tagName === 'link' && regex.test(tag.attributes.href)) {
      assetUrl = tag.attributes.href;
      tag = {
        tagName: 'style',
        closeTag: true,
        attributes: {
          type: 'text/css'
        }
      };
    }
```

Meanwhile, we can have some preloaded resources which are not stylesheets 

```html
    <link rel="preload" href="main.js" as="script">
```

Link: https://github.com/DustinJackson/html-webpack-inline-source-plugin/blob/master/index.js#L98


## resource-hints-webpack-plugin
Currently, the plugin does not allow injecting preload links for arbitrary files (chunks only).

Link: https://github.com/jantimon/resource-hints-webpack-plugin/issues/8
