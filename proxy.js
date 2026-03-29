/**
 * Local proxy server — bypasses CORS for FlightAware & MyTSA in web preview.
 * Run with: node proxy.js
 * Runs on http://localhost:3001
 */

const http = require('http');
const https = require('https');

const PORT = 3001;
const API_KEY = 'nRNqxaulFP9Cx7qLuP2PXQhNs9qr0wVi';

const server = http.createServer((req, res) => {
  // Allow all origins (local dev only)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-apikey');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const target = url.searchParams.get('url');

  if (!target) {
    res.writeHead(400); res.end('Missing ?url= param'); return;
  }

  const isFlightAware = target.includes('aeroapi.flightaware.com');
  const options = new URL(target);

  const reqOptions = {
    hostname: options.hostname,
    path: options.pathname + options.search,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(isFlightAware ? { 'x-apikey': API_KEY } : {}),
    },
  };

  const proxyReq = https.request(reqOptions, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502); res.end(JSON.stringify({ error: e.message }));
  });

  proxyReq.end();
});

server.listen(PORT, () => {
  console.log(`FlightRest proxy running on http://localhost:${PORT}`);
  console.log('Proxying FlightAware AeroAPI requests...');
});
