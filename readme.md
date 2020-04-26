# Overview
A webpack config for react single page application.

## Production
For production build it includes cache management, advanced html 
injection logic (with a custom plugin on top of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)), 
image optimization, and usual webpack optimizations (such as codesplitting, minification, etc.).
 
## Development
As a development build it is served with hmr (using [react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin)) 
including html watch reload. You can run dev-server using ```serve:dev``` command.

If you want to check out your production build locally, you can build project with ```npm run build:prod``` command and 
use one of the following approaches.

#### https/http2 local server
To set up local https/http2 server you need to do the following: 
- install openssl if it's not installed on your system
- in the project directory enter the ssl folder ```cd ssl```
- run ```gen-certificate.sh```, this will create certificate authority data and server data; it is recommended to set 
organization name to something like '@akachicon/webpack-react-spa', so you can easily find it later
- install the generated certificate ca.pem from ```ssl/``` into your browser, don't forget to set 'Trust this CA to identify websites' flag:
    - chrome: privacy and security -> more -> manage certificates -> authorities -> import
    - firefox: privacy & security -> certificates -> view certificates -> authorities -> import
- run ```npm run serve:http2 -- --port=3030``` in project dir; ```--port``` can be omitted, 3030 is used by default

#### http1.1 local server
To set up local http1.1 server you need to do the following: 
- run ```npm run serve:http1.1 -- --port=3030```. ```--port``` can be omitted, 3030 is used by default
 
## css and linting
For css handling this config uses dart-sass (to enable scss module system) and css-modules. 
Intermediary postcss plugins could be applied. For linting a combination of prettier, eslint, and stylelint is used.
Linting is checked on pre-commit hook using [husky](https://github.com/typicode/husky). 
 