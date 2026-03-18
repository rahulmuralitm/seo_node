const axios = require('axios');

exports.fetchHtml = async (url) => {
  try {
    const startTime = Date.now();
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'SEOAuditBot/1.0 (+https://example.com)',
      },
      // Avoid fetching massive files, max 5MB
      maxContentLength: 5 * 1024 * 1024,
      timeout: 10000,
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Estimate page size in bytes based on string length, fallback to headers
    let pageSize = response.headers['content-length'] 
      ? parseInt(response.headers['content-length'], 10) 
      : Buffer.byteLength(response.data, 'utf8');

    return {
      success: true,
      html: response.data,
      pageSize,
      responseTime,
      headers: response.headers,
      finalUrl: response.request?.res?.responseUrl || url
    };
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return { success: false, error: error.message };
  }
};
