const fs = require('fs');
const http = require('http');
const serveHandler = require('serve-handler');
const regexEscape = require('regex-escape');
const { outDir, htmlFilename } = require('../../project.config');

const matchPort = (arg) => arg.match('--port=\\d+');
const portArg = process.argv.find(matchPort);
const port = portArg ? +portArg.split('=')[1] : 3030;

const indexFile = fs
  .readdirSync(outDir)
  .find((file) => file.match(regexEscape(htmlFilename)));

const options = {
  public: outDir,
  directoryListing: false,
  rewrites: [{ source: '/**', destination: `/${indexFile}` }],
  headers: [
    {
      source: '**/*.@(js|css|jpg|jpeg|gif|png|svg|woff2|woff)',
      headers: [
        {
          key: 'Cache-Control',
          value: `max-age=${60 * 60 * 24 * 365}`,
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: `*`,
        },
      ],
    },
  ],
};

const server = http.createServer((req, res) => serveHandler(req, res, options));

server.listen(port, () => console.log(`server listening to port ${port}`));
