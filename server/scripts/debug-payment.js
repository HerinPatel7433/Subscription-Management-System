require('dotenv').config();
const http = require('http');

// Login first to get a token
const loginData = JSON.stringify({
  email: 'heneelchhatbar69@gmail.com',
  password: 'Heneeladmin@123'
});

function doRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Login
  const loginRes = await doRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);
  const loginJson = JSON.parse(loginRes.body);
  const token = loginJson.token;
  console.log('Login status:', loginRes.status, '| Token:', token ? 'OK' : 'MISSING');
  if (!token) { console.error('Cannot proceed without token'); return; }

  // Get invoices
  const invRes = await doRequest({
    hostname: 'localhost', port: 5000, path: '/api/invoices', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  }, null);
  const invJson = JSON.parse(invRes.body);
  const invoices = invJson.data || invJson;
  console.log('\nInvoices (total:', Array.isArray(invoices) ? invoices.length : 'not array', ')');
  if (Array.isArray(invoices)) {
    invoices.forEach(i => console.log(`  ${i.id} | ${i.status} | ${i.amount}`));
  }

  const confirmed = Array.isArray(invoices) ? invoices.find(i => i.status === 'confirmed') : null;
  if (!confirmed) { console.log('\n❌ No confirmed invoice found!'); return; }

  // Test payment with different field combinations to find which works
  const tests = [
    { label: 'payment_method field', body: { invoice_id: confirmed.id, payment_method: 'bank_transfer', amount: 50 } },
    { label: 'method field', body: { invoice_id: confirmed.id, method: 'bank_transfer', amount: 50 } },
    { label: 'with payment_date', body: { invoice_id: confirmed.id, payment_method: 'bank_transfer', amount: 50, payment_date: '2026-04-05' } },
  ];

  for (const test of tests) {
    const bodyStr = JSON.stringify(test.body);
    const res = await doRequest({
      hostname: 'localhost', port: 5000, path: '/api/payments', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Authorization': `Bearer ${token}`
      }
    }, bodyStr);
    console.log(`\n[${test.label}]`);
    console.log('  Status:', res.status);
    console.log('  Response:', res.body);
  }
}

main().catch(console.error);
