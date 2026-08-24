const https = require('https');

const options = {
  hostname: 'wa.tukonectdigital.co.ke',
  port: 443,
  path: '/health',
  method: 'GET',
  rejectUnauthorized: true
};

console.log('Sending HTTPS request to https://wa.tukonectdigital.co.ke/health...');
const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);

  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error('Request failed with error:', e);
});

req.end();
