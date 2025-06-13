// backend/test-basic.js
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testBasicEndpoints() {
  console.log('🧪 Testing The Beacon Centre API - Basic Endpoints\n');

  try {
    // Test basic health endpoint
    console.log('1. Testing basic health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed');
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   Environment: ${healthResponse.data.environment}`);
    console.log(`   Message: ${healthResponse.data.message}\n`);

    // Test database health (should work even without DB)
    console.log('2. Testing database health endpoint...');
    try {
      const dbResponse = await axios.get(`${BASE_URL}/health/db`);
      console.log('✅ Database health check:', dbResponse.data.status);
      console.log(`   Message: ${dbResponse.data.message}\n`);
    } catch (dbError) {
      console.log('⚠️  Database health check failed (expected if no DB configured)');
      console.log(`   Error: ${dbError.response?.data?.message || 'Connection failed'}\n`);
    }

    // Test system health endpoint
    console.log('3. Testing system health endpoint...');
    try {
      const systemResponse = await axios.get(`${BASE_URL}/health/system`);
      console.log('✅ System health check passed');
      console.log(`   JWT: ${systemResponse.data.services.jwt.status}`);
      console.log(`   Database: ${systemResponse.data.services.database.status}`);
      console.log(`   Cloudinary: ${systemResponse.data.services.cloudinary.status}\n`);
    } catch (systemError) {
      console.log('⚠️  System health check issues detected');
      console.log(`   Error: ${systemError.response?.data?.message || 'System check failed'}\n`);
    }

    // Test CORS and basic API structure
    console.log('4. Testing API endpoint structure...');
    const endpoints = [
      '/api/devotionals',
      '/api/video-sermons', 
      '/api/audio-sermons',
      '/api/announcements',
      '/api/categories'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`);
        console.log(`✅ ${endpoint}: OK (${response.status})`);
      } catch (error) {
        // Expected to fail without database, but should return proper error format
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        
        if (statusCode === 500 && errorData?.success === false) {
          console.log(`⚠️  ${endpoint}: Expected error (${statusCode}) - No database`);
        } else {
          console.log(`❌ ${endpoint}: Unexpected error (${statusCode})`);
        }
      }
    }

    console.log('\n🎉 Basic server test completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Set up a PostgreSQL database');
    console.log('   2. Update DATABASE_URL in .env file');
    console.log('   3. Run: npm run db:migrate');
    console.log('   4. Run: npm run db:seed');
    console.log('   5. Test with full functionality');

  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testBasicEndpoints();
}

module.exports = { testBasicEndpoints };