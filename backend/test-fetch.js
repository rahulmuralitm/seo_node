const fetchService = require('./services/fetchService');

async function testFetch() {
  const testUrls = [
    'https://httpbin.org/get',
    'https://example.com',
    'https://google.com',
    'https://oxygengroup.in'
  ];

  console.log('Testing fetch service...\n');

  for (const url of testUrls) {
    console.log(`\n=== Testing ${url} ===`);
    try {
      const result = await fetchService.fetchHtml(url);
      if (result.success) {
        console.log('✅ SUCCESS');
        console.log(`Response time: ${result.responseTime}ms`);
        console.log(`Page size: ${result.pageSize} bytes`);
        console.log(`Status: ${result.statusCode}`);
      } else {
        console.log('❌ FAILED');
        console.log(`Error: ${result.error}`);
        console.log(`Error code: ${result.errorCode}`);
        console.log(`Status code: ${result.statusCode}`);
      }
    } catch (error) {
      console.log('❌ EXCEPTION');
      console.log(`Exception: ${error.message}`);
    }
  }
}

testFetch().catch(console.error);