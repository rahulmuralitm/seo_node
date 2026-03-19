# SEO Analyzer Backend

A Node.js backend service for comprehensive SEO analysis including website scanning, security checks, CSP validation, and sitemap generation.

## Features

- **Website Analysis**: Comprehensive SEO scanning with performance metrics
- **Security Checks**: Automated security vulnerability detection
- **CSP Validation**: Content Security Policy analysis and recommendations
- **Sitemap Generation**: Multiple sitemap types (XML, HTML, Image, Robots.txt)
- **AI Chatbot**: Intelligent assistance for SEO guidance
- **Production Ready**: Optimized for hosted environments with retry logic and rate limiting

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
NODE_ENV=production
PORT=3000
FETCH_TIMEOUT_PRODUCTION=30000
FETCH_TIMEOUT_DEVELOPMENT=15000
MAX_RETRIES=3
MIN_REQUEST_INTERVAL=1000
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:4200
MAX_PAYLOAD_SIZE=10mb
```

## Installation

```bash
npm install
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
# or
npm run test-fetch
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/test` - External connectivity test
- `POST /api/scan` - Website SEO analysis
- `POST /api/chatbot` - AI chatbot assistance

## Deployment

### For Hosted Environments (Render, Heroku, etc.)

1. Set environment variables in your hosting platform
2. Ensure `NODE_ENV=production`
3. Configure `ALLOWED_ORIGINS` for your frontend domain
4. Set appropriate timeouts for production

### Common Issues

- **ETIMEDOUT**: Increase `FETCH_TIMEOUT_PRODUCTION` or check if target site blocks hosted requests
- **CORS Errors**: Add your frontend domain to `ALLOWED_ORIGINS`
- **Rate Limiting**: Some sites block automated requests - the service includes retry logic and user-agent rotation

## Architecture

- **fetchService.js**: Robust HTTP fetching with retry logic and error handling
- **analyzerService.js**: Core SEO analysis logic
- **scanController.js**: API endpoint handling
- **server.js**: Express server configuration with CORS and middleware

## Testing

Run the included test script to verify network connectivity:

```bash
node test-fetch.js
```

This tests fetching from multiple sites including the problematic oxygengroup.in domain.