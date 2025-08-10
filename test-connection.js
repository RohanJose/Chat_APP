// Test script to verify backend connection
const https = require('https');

console.log('🧪 Testing backend connection...\n');

// Test 1: Health check
console.log('1️⃣ Testing health check...');
https.get('https://chat-app-tlxx.onrender.com/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Health check passed:', data);
    console.log('Status:', res.statusCode);
  });
}).on('error', (err) => {
  console.log('❌ Health check failed:', err.message);
});

// Test 2: CORS headers
console.log('\n2️⃣ Testing CORS headers...');
const options = {
  hostname: 'chat-app-tlxx.onrender.com',
  port: 443,
  path: '/health',
  method: 'GET',
  headers: {
    'Origin': 'https://chat-app-alpha-blue-30.vercel.app'
  }
};

const req = https.request(options, (res) => {
  console.log('✅ CORS test passed');
  console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('Status:', res.statusCode);
});

req.on('error', (err) => {
  console.log('❌ CORS test failed:', err.message);
});

req.end();

console.log('\n🎯 Frontend URL:', 'https://chat-app-alpha-blue-30.vercel.app');
console.log('🔗 Backend URL:', 'https://chat-app-tlxx.onrender.com');
console.log('\n📝 Next steps:');
console.log('1. Update Vercel environment variables');
console.log('2. Update Render environment variables');
console.log('3. Redeploy frontend on Vercel');
console.log('4. Test the connection!');
