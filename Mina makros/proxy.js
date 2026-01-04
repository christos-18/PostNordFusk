#!/usr/bin/env node

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3001;
const TARGET_HOST = 'dp.postnord.com';
const TARGET_PATH = '/dp/routeinfo';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token, Accept');
}

const server = http.createServer((req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' || !req.url.startsWith('/routeinfo')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = new URL(`https://${TARGET_HOST}${TARGET_PATH}`);

  targetUrl.search = url.search;

  const proxyReq = https.request(
    targetUrl,
    {
      method: 'GET',
      headers: {
        accept: req.headers.accept || 'application/json, text/plain, */*',
        'content-type': req.headers['content-type'] || 'application/json',
        'x-auth-token': req.headers['x-auth-token'] || ''
      }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, {
        'Content-Type': proxyRes.headers['content-type'] || 'application/json'
      });
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy request failed', details: err.message }));
  });

  proxyReq.end();
});

server.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log(`Forwarding /routeinfo -> https://${TARGET_HOST}${TARGET_PATH}`);
});