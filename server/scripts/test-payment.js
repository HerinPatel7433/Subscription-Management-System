require('dotenv').config();
const http = require('http');

// First get a valid JWT by logging in
const loginData = JSON.stringify({
  email: 'heneelchhatbar69@gmail.com',
  password: 'Heneeladmin@123'
});

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Step 1: Login
  console.log('--- Logging in ---');
  const loginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, loginData);
  
  if (loginRes.status !== 200) {
    console.error('Login failed:', JSON.stringify(loginRes, null, 2));
    return;
  }
  const token = loginRes.body?.token;
  console.log('Login OK. Token:', token?.slice(0, 40) + '...');

  // Step 2: Get all invoices
  console.log('\n--- Fetching invoices ---');
  const invRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/invoices', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  }, null);
  console.log('Invoice fetch status:', invRes.status);
  const invoices = invRes.body || [];
  const confirmedInvoice = invoices.find ? invoices.find(i => i.status === 'confirmed') : null;
  console.log('Invoices count:', Array.isArray(invoices) ? invoices.length : 'N/A');
  console.log('First confirmed invoice:', confirmedInvoice ? `${confirmedInvoice.id} (${confirmedInvoice.status})` : 'NONE FOUND');

  if (!confirmedInvoice) {
    console.log('\n⚠️  No confirmed invoices found. Listing all invoices:');
    if (Array.isArray(invoices)) {
      invoices.forEach(i => console.log(`  - ${i.id} status: ${i.status}`));
    }
    return;
  }

  // Step 3: POST a payment
  console.log('\n--- Recording a payment ---');
  const paymentData = JSON.stringify({
    invoice_id: confirmedInvoice.id,
    payment_method: 'bank_transfer',
    amount: 100
  });
  const payRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/payments', method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(paymentData),
      'Authorization': `Bearer ${token}`
    }
  }, paymentData);
  
  console.log('Payment POST status:', payRes.status);
  console.log('Response:', JSON.stringify(payRes.body, null, 2));
}

main().catch(console.error);
