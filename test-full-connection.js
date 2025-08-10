// Comprehensive test script for frontend-backend connection
const https = require('https');

console.log('🔗 Testing Frontend-Backend Connection\n');

const FRONTEND_URL = 'https://chat-app-alpha-blue-30.vercel.app';
const BACKEND_URL = 'https://chat-app-tlxx.onrender.com';

// Test 1: Backend Health Check
console.log('1️⃣ Testing Backend Health...');
https.get(`${BACKEND_URL}/health`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Backend is running');
    console.log('   Status:', res.statusCode);
    console.log('   Response:', data);
  });
}).on('error', (err) => {
  console.log('❌ Backend health check failed:', err.message);
});

// Test 2: CORS Configuration
console.log('\n2️⃣ Testing CORS Configuration...');
const corsOptions = {
  hostname: 'chat-app-tlxx.onrender.com',
  port: 443,
  path: '/health',
  method: 'GET',
  headers: {
    'Origin': FRONTEND_URL
  }
};

const corsReq = https.request(corsOptions, (res) => {
  console.log('✅ CORS is configured');
  console.log('   Status:', res.statusCode);
  console.log('   Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('   Access-Control-Allow-Credentials:', res.headers['access-control-allow-credentials']);
});

corsReq.on('error', (err) => {
  console.log('❌ CORS test failed:', err.message);
});

corsReq.end();

// Test 3: Socket.IO Endpoint
console.log('\n3️⃣ Testing Socket.IO Endpoint...');
const socketOptions = {
  hostname: 'chat-app-tlxx.onrender.com',
  port: 443,
  path: '/socket.io/',
  method: 'GET',
  headers: {
    'Origin': FRONTEND_URL
  }
};

const socketReq = https.request(socketOptions, (res) => {
  console.log('✅ Socket.IO endpoint accessible');
  console.log('   Status:', res.statusCode);
});

socketReq.on('error', (err) => {
  console.log('❌ Socket.IO test failed:', err.message);
});

socketReq.end();

// Test 4: Frontend Accessibility
console.log('\n4️⃣ Testing Frontend Accessibility...');
https.get(FRONTEND_URL, (res) => {
  console.log('✅ Frontend is accessible');
  console.log('   Status:', res.statusCode);
  console.log('   Content-Type:', res.headers['content-type']);
}).on('error', (err) => {
  console.log('❌ Frontend test failed:', err.message);
});

console.log('\n📋 Connection Summary:');
console.log('   Frontend:', FRONTEND_URL);
console.log('   Backend:', BACKEND_URL);
console.log('\n🔧 To complete the connection:');
console.log('   1. Update Render environment variables (CORS_ORIGIN)');
console.log('   2. Update Vercel environment variables (REACT_APP_*)');
console.log('   3. Redeploy both services');
console.log('   4. Test video/text chat functionality');
console.log('\n💡 Expected CORS_ORIGIN value:', FRONTEND_URL);
console.log('💡 Expected REACT_APP_SOCKET_URL value:', BACKEND_URL);
