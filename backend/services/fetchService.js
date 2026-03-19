const axios = require('axios');

// Different user agents to rotate through
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple rate limiting - track last request time per domain
const lastRequestTime = new Map();
const MIN_REQUEST_INTERVAL = parseInt(process.env.MIN_REQUEST_INTERVAL) || 1000; // 1 second between requests to same domain

const getDomainFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

const enforceRateLimit = async (url) => {
  const domain = getDomainFromUrl(url);
  const now = Date.now();
  const lastTime = lastRequestTime.get(domain) || 0;
  const timeSinceLastRequest = now - lastTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms for ${domain}`);
    await sleep(waitTime);
  }

  lastRequestTime.set(domain, Date.now());
};

exports.fetchHtml = async (url, retries = parseInt(process.env.MAX_RETRIES) || 3) => {
  let lastError;

  console.log(`Starting fetch for ${url} in ${process.env.NODE_ENV || 'development'} environment`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Enforce rate limiting before making request
      await enforceRateLimit(url);

      const startTime = Date.now();
      const userAgent = getRandomUserAgent();

      console.log(`Attempting to fetch ${url} (attempt ${attempt}/${retries}) with User-Agent: ${userAgent.substring(0, 50)}...`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        // Increased timeout for hosted environments
        timeout: process.env.NODE_ENV === 'production'
          ? parseInt(process.env.FETCH_TIMEOUT_PRODUCTION) || 30000
          : parseInt(process.env.FETCH_TIMEOUT_DEVELOPMENT) || 15000,
        maxContentLength: 10 * 1024 * 1024, // Increased to 10MB
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept 2xx and 3xx
        },
        // Add proxy support for hosted environments
        proxy: false, // Disable proxy to avoid issues in hosted environments
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Estimate page size in bytes based on string length, fallback to headers
      let pageSize = response.headers['content-length']
        ? parseInt(response.headers['content-length'], 10)
        : Buffer.byteLength(response.data, 'utf8');

      console.log(`Successfully fetched ${url} in ${responseTime}ms`);

      return {
        success: true,
        html: response.data,
        pageSize,
        responseTime,
        headers: response.headers,
        finalUrl: response.request?.res?.responseUrl || url,
        statusCode: response.status
      };
    } catch (error) {
      lastError = error;
      const errorCode = error.code || 'UNKNOWN';
      const errorMessage = error.message || 'Unknown error';

      console.error(`Attempt ${attempt} failed for ${url}:`, {
        code: errorCode,
        message: errorMessage,
        status: error.response?.status,
        environment: process.env.NODE_ENV || 'development'
      });

      // Don't retry on certain errors
      if (errorCode === 'ENOTFOUND' ||
          errorCode === 'ECONNREFUSED' ||
          error.response?.status === 403 ||
          error.response?.status === 429) { // Too Many Requests
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
      }
    }
  }

  // All retries failed
  const errorCode = lastError?.code;
  const statusCode = lastError?.response?.status;

  let errorMessage = 'Failed to fetch website';

  if (errorCode === 'ETIMEDOUT') {
    errorMessage = process.env.NODE_ENV === 'production'
      ? 'Request timed out - the website may be slow, blocking requests from hosted servers, or experiencing issues. Try again later.'
      : 'Request timed out - the website may be slow or unresponsive.';
  } else if (errorCode === 'ENOTFOUND') {
    errorMessage = 'Website not found - please check the URL and try again.';
  } else if (errorCode === 'ECONNREFUSED') {
    errorMessage = 'Connection refused - the website may be blocking requests or is temporarily unavailable.';
  } else if (statusCode === 403) {
    errorMessage = 'Access forbidden - the website is blocking automated requests. This is common with hosted services.';
  } else if (statusCode === 429) {
    errorMessage = 'Too many requests - the website is rate limiting requests. Please wait and try again.';
  } else if (statusCode === 404) {
    errorMessage = 'Page not found (404) - the URL may be incorrect or the page may have been moved.';
  } else if (statusCode >= 500) {
    errorMessage = 'Server error - the website is experiencing technical difficulties.';
  } else {
    errorMessage = `Failed to fetch website: ${lastError?.message || 'Unknown error'}`;
  }

  console.error(`All attempts failed for ${url}:`, {
    errorCode,
    statusCode,
    message: errorMessage,
    environment: process.env.NODE_ENV || 'development'
  });

  return {
    success: false,
    error: errorMessage,
    errorCode,
    statusCode
  };
};
