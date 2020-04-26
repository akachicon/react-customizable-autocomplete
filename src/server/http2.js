const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const regexEscape = require('regex-escape');
const { baseDir, outDir, htmlFilename } = require('../../project.config');

const cacheableExt = [
  'js',
  'css',
  'jpg',
  'jpeg',
  'gif',
  'png',
  'svg',
  'woff2',
  'woff',
];

const matchPort = (arg) => arg.match('--port=\\d+');
const portArg = process.argv.find(matchPort);
const port = portArg ? +portArg.split('=')[1] : 3030;

const sslDir = path.resolve(baseDir, 'ssl');
const keyPath = path.resolve(sslDir, 'server.key');
const certPath = path.resolve(sslDir, 'server.crt');
const key = fs.readFileSync(keyPath);
const cert = fs.readFileSync(certPath);

const options = { key, cert };

const {
  HTTP2_HEADER_PATH,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} = http2.constants;

const server = http2.createSecureServer(options);
const serverRoot = outDir;

const indexFile = fs
  .readdirSync(serverRoot)
  .find((file) => file.match(regexEscape(htmlFilename)));

const indexPath = path.join(serverRoot, indexFile);

function respondToStreamError(err, stream) {
  console.log(err);
  if (err.code === 'ENOENT') {
    stream.respond({ ':status': HTTP_STATUS_NOT_FOUND });
  } else {
    stream.respond({
      ':status': HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
  stream.end();
}

server.on('stream', (stream, headers) => {
  const reqPath = headers[HTTP2_HEADER_PATH];
  let responseMimeType = mime.lookup(reqPath);
  let fullPath = path.join(serverRoot, reqPath.replace(/\//g, path.sep));

  if (!mime.lookup(fullPath)) {
    fullPath = indexPath;
    responseMimeType = 'text/html';
  }

  const reqExt = reqPath.slice(reqPath.lastIndexOf('.') + 1);
  const cacheHeaders = {};
  if (cacheableExt.includes(reqExt)) {
    cacheHeaders['Cache-Control'] = `max-age=${60 * 60 * 24 * 365}`;
  }

  stream.respondWithFile(
    fullPath,
    {
      'content-type': responseMimeType,
      'Access-Control-Allow-Origin': '*',
      ...cacheHeaders,
    },
    { onError: (err) => respondToStreamError(err, stream) }
  );
});

server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`server listening to port ${port}`);
});
