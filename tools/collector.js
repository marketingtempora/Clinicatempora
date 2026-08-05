// Recibe las huellas de layout de cada página y las guarda en disco.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;

http
  .createServer((req, res) => {
    const cors = {
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    };
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors).end();
      return;
    }
    const name = new URL(req.url, 'http://x').searchParams.get('name') || 'fp';
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const file = path.join(DIR, `fp-${name}.json`);
      fs.writeFileSync(file, body, 'utf8');
      console.log(`guardado ${file} (${(body.length / 1024).toFixed(1)} KB)`);
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }).end('{"ok":true}');
    });
  })
  .listen(5599, () => console.log('colector en http://localhost:5599'));
