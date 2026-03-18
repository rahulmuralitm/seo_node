const recommendationsMap = {
  https_missing: {
    issue: "Website does not use HTTPS",
    severity: "Critical",
    solution: "Obtain an SSL certificate and force all traffic to use HTTPS.",
    suggestion: "Google has used HTTPS as a ranking signal since 2014. Free SSL certificates are available via Let's Encrypt. Make sure to set up 301 redirects from HTTP to HTTPS to preserve link equity.",
    example: "# Apache .htaccess redirect\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]"
  },
  canonical_missing: {
    issue: "Missing canonical tag",
    severity: "Info",
    solution: "Add a <link rel=\"canonical\" href=\"...\"> tag to prevent duplicate content issues.",
    suggestion: "Canonical tags tell search engines which URL is the 'master' version of a page. This is especially important if your content is accessible via multiple URLs (e.g., with/without www, or with query strings).",
    example: "<head>\n  <link rel=\"canonical\" href=\"https://www.yoursite.com/your-page/\" />\n</head>"
  },
  viewport_missing: {
    issue: "Missing viewport meta tag",
    severity: "Critical",
    solution: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"> for mobile responsiveness.",
    suggestion: "Without a viewport meta tag, mobile browsers render the page at a typical desktop screen width and then scale it down, resulting in a poor user experience. Google uses mobile-first indexing, so this is critical for rankings.",
    example: "<head>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n</head>"
  },
  title_missing: {
    issue: "Missing title tag",
    severity: "Critical",
    solution: "Add a <title> tag within the <head> section of your HTML.",
    suggestion: "The title tag is one of the most important on-page SEO elements. It appears in browser tabs, search engine results pages (SERPs), and social shares. Every page should have a unique, descriptive title.",
    example: "<head>\n  <title>Your Page Title – Brand Name</title>\n</head>"
  },
  title_length: {
    issue: "Title length is not optimal",
    severity: "Warning",
    solution: "Ensure your title tag is between 30 and 60 characters long.",
    suggestion: "Search engines typically display the first 50–60 characters of a title tag. Titles that are too short may not be descriptive enough; titles that are too long will be truncated in SERPs. Front-load your primary keyword.",
    example: "<!-- Too short (bad) -->\n<title>Home</title>\n\n<!-- Too long (bad) -->\n<title>Welcome to Our Amazing Website Where You Can Find All Kinds of Products and Services</title>\n\n<!-- Optimal (good) -->\n<title>Affordable SEO Tools for Small Businesses – SEOScan</title>"
  },
  meta_desc_missing: {
    issue: "Missing meta description",
    severity: "High",
    solution: "Add a meta description between 120 and 160 characters summarizing the page.",
    suggestion: "While meta descriptions are not a direct ranking factor, they significantly impact click-through rate (CTR) from SERPs. A compelling description acts like ad copy — it convinces users to choose your result over competitors.",
    example: "<head>\n  <meta name=\"description\" content=\"SEOScan helps you analyze any website for SEO issues in seconds. Get actionable recommendations to improve your search engine rankings.\" />\n</head>"
  },
  meta_desc_length: {
    issue: "Meta description length is not optimal",
    severity: "Warning",
    solution: "Ensure your meta description is between 120 and 160 characters long.",
    suggestion: "Descriptions shorter than 120 characters may leave valuable SERP real estate unused. Descriptions longer than 160 characters will be cut off with '...'. Aim for 145–155 characters for the best results.",
    example: "<!-- Too short (bad) -->\n<meta name=\"description\" content=\"SEO tool.\" />\n\n<!-- Optimal (good, ~150 chars) -->\n<meta name=\"description\" content=\"Analyze your website's SEO health for free. SEOScan checks meta tags, headings, images, and more to give you an actionable improvement plan.\" />"
  },
  h1_missing: {
    issue: "Missing H1 heading",
    severity: "High",
    solution: "Add exactly one <h1> heading summarizing the content of the page.",
    suggestion: "The H1 heading is the primary signal that tells search engines what the page is about. It should include your target keyword and match the intent of the page. Think of it like the headline of a newspaper article.",
    example: "<!-- Good H1 usage -->\n<h1>Free SEO Analysis Tool – Scan Any Website Instantly</h1>\n\n<!-- Follow with H2 subheadings -->\n<h2>How It Works</h2>\n<h2>Key Features</h2>"
  },
  h1_multiple: {
    issue: "Multiple H1 headings found",
    severity: "Warning",
    solution: "Ensure there is only one <h1> heading per page for better SEO structure.",
    suggestion: "Having multiple H1 tags confuses search engines about the primary topic of your page. Use H2 and H3 tags to structure subtopics. The correct heading hierarchy (H1 → H2 → H3) helps both crawlers and users navigate content.",
    example: "<!-- INCORRECT: Multiple H1s -->\n<h1>Our Services</h1>\n<h1>Contact Us</h1>\n\n<!-- CORRECT: One H1, use H2 for subsections -->\n<h1>Our Services</h1>\n<h2>Web Design</h2>\n<h2>SEO Optimization</h2>\n<h2>Contact Us</h2>"
  },
  images_missing_alt: {
    issue: "Images missing alt attributes",
    severity: "Warning",
    solution: "Add descriptive 'alt' attributes to all images for accessibility and image SEO.",
    suggestion: "Alt text serves two purposes: it improves accessibility for screen readers, and it helps search engines understand what an image depicts (enabling ranking in Google Image Search). Describe the image content concisely — avoid keyword stuffing.",
    example: "<!-- Missing alt (bad) -->\n<img src=\"logo.png\" />\n\n<!-- Empty alt for decorative images (ok) -->\n<img src=\"divider.png\" alt=\"\" />\n\n<!-- Descriptive alt (good) -->\n<img src=\"seo-dashboard.png\" alt=\"SEOScan dashboard showing a website score of 87 out of 100\" />"
  },
  internal_links_missing: {
    issue: "No internal links found",
    severity: "Info",
    solution: "Add links to other pages on your website to improve crawling and user navigation.",
    suggestion: "Internal links distribute 'link equity' (ranking power) across your site and help search engine crawlers discover all your pages. Good internal linking also keeps users engaged longer by guiding them to related content.",
    example: "<!-- Add contextual internal links in your content -->\n<p>Learn more about our <a href=\"/features\">SEO analysis features</a> or check our\n<a href=\"/blog/seo-guide\">beginner's guide to SEO</a>.</p>\n\n<!-- Also add a site-wide navigation -->\n<nav>\n  <a href=\"/\">Home</a>\n  <a href=\"/features\">Features</a>\n  <a href=\"/pricing\">Pricing</a>\n</nav>"
  },
  external_links_missing: {
    issue: "No external links found",
    severity: "Info",
    solution: "Add relevant outbound links to authoritative sources to improve credibility.",
    suggestion: "Linking out to high-authority, relevant sources (like Google, Wikipedia, or industry publications) signals to search engines that your content is well-researched. Use 'rel=\"noopener noreferrer\"' for security on links opening in new tabs.",
    example: "<!-- Outbound link to an authority source -->\n<p>According to\n  <a href=\"https://developers.google.com/search/docs\" target=\"_blank\" rel=\"noopener noreferrer\">\n    Google's Search documentation\n  </a>, page experience signals are key ranking factors.\n</p>"
  },
  low_word_count: {
    issue: "Low word count",
    severity: "Warning",
    solution: "Increase the content on the page to at least 300 words for better topic depth.",
    suggestion: "Thin content (under 300 words) is often a sign of low-quality pages and can hurt rankings. Longer, comprehensive content that thoroughly covers a topic tends to rank better. Aim for 800–1500+ words for blog posts, or at least 300–500 for product/service pages.",
    example: "<!-- Content structure suggestion -->\n<article>\n  <h1>Complete Guide to On-Page SEO</h1>\n  <p>Introduction paragraph explaining what the article covers...</p>\n  \n  <h2>1. Title Tags</h2>\n  <p>Detailed explanation with at least 2-3 paragraphs...</p>\n  \n  <h2>2. Meta Descriptions</h2>\n  <p>Detailed explanation with examples...</p>\n  \n  <!-- Continue with more sections to reach 800+ words -->\n</article>"
  },
  page_size_large: {
    issue: "Page size is too large",
    severity: "Warning",
    solution: "Optimize images, minify CSS and JS, or enable compression to reduce page size.",
    suggestion: "Large page sizes lead to slower load times, which directly hurts your Core Web Vitals score and rankings. The biggest wins usually come from image compression. Use WebP format for images, enable gzip/Brotli on your server, and defer non-critical scripts.",
    example: "<!-- Use optimized WebP images with fallback -->\n<picture>\n  <source srcset=\"image.webp\" type=\"image/webp\" />\n  <img src=\"image.jpg\" alt=\"Description\" loading=\"lazy\" />\n</picture>\n\n<!-- Enable gzip in Apache .htaccess -->\n<IfModule mod_deflate.c>\n  AddOutputFilterByType DEFLATE text/html text/css application/javascript\n</IfModule>"
  },
  html_lang_missing: {
    issue: "Missing language attribute",
    severity: "Warning",
    solution: "Add a 'lang' attribute to your <html> tag (e.g., <html lang=\"en\">).",
    suggestion: "The `lang` attribute helps search engines understand the language of your page's content, which is important for multilingual SEO and serving results to the right audience. It also improves accessibility for screen readers.",
    example: "<!-- English -->\n<!DOCTYPE html>\n<html lang=\"en\">\n\n<!-- Spanish -->\n<!DOCTYPE html>\n<html lang=\"es\">\n\n<!-- French (Canada) -->\n<!DOCTYPE html>\n<html lang=\"fr-CA\">"
  },
  robots_noindex: {
    issue: "Page is blocked from indexing",
    severity: "Critical",
    solution: "Remove the 'noindex' directive from the meta robots tag if you want this page to be found by search engines.",
    suggestion: "A `noindex` tag tells search engine crawlers to exclude this page from their index entirely — it will not appear in any search results. This is intentional for admin pages or thank-you pages, but devastating if applied to important content by mistake.",
    example: "<!-- BLOCKS indexing (only use intentionally) -->\n<meta name=\"robots\" content=\"noindex, nofollow\" />\n\n<!-- ALLOWS indexing (use this for public pages) -->\n<meta name=\"robots\" content=\"index, follow\" />\n\n<!-- Or simply remove the meta robots tag entirely to allow indexing -->"
  },
  og_tags_missing: {
    issue: "Missing or incomplete Open Graph tags",
    severity: "Warning",
    solution: "Add og:title, og:description, and og:image meta tags to improve social media sharing previews.",
    suggestion: "Open Graph (OG) tags control how your content appears when shared on Facebook, LinkedIn, Twitter, and other platforms. Without them, social platforms choose content arbitrarily — often picking a random image or no description at all. A good OG image should be 1200×630px.",
    example: "<head>\n  <!-- Essential Open Graph tags -->\n  <meta property=\"og:title\" content=\"Free SEO Analysis Tool – SEOScan\" />\n  <meta property=\"og:description\" content=\"Scan any website for SEO issues in seconds and get actionable recommendations.\" />\n  <meta property=\"og:image\" content=\"https://www.yoursite.com/og-image.png\" />\n  <meta property=\"og:url\" content=\"https://www.yoursite.com/\" />\n  <meta property=\"og:type\" content=\"website\" />\n\n  <!-- Twitter Card tags (optional but recommended) -->\n  <meta name=\"twitter:card\" content=\"summary_large_image\" />\n  <meta name=\"twitter:title\" content=\"Free SEO Analysis Tool – SEOScan\" />\n</head>"
  },
  favicon_missing: {
    issue: "Missing Favicon",
    severity: "Info",
    solution: "Link a favicon to your site to improve tab identification and brand presence.",
    suggestion: "A favicon is the small icon shown in browser tabs, bookmarks, and mobile home screens. While it doesn't affect SEO rankings directly, it contributes to brand recognition and a professional appearance. Generate multiple sizes using a tool like favicon.io.",
    example: "<head>\n  <!-- Standard favicon -->\n  <link rel=\"icon\" href=\"/favicon.ico\" sizes=\"any\" />\n\n  <!-- SVG favicon (modern browsers) -->\n  <link rel=\"icon\" href=\"/favicon.svg\" type=\"image/svg+xml\" />\n\n  <!-- Apple Touch Icon (iOS) -->\n  <link rel=\"apple-touch-icon\" href=\"/apple-touch-icon.png\" />\n</head>"
  },
  response_time_slow: {
    issue: "Slow server response time",
    severity: "High",
    solution: "Optimize server response times to be under 2000ms. Consider caching, upgrading infrastructure, or optimizing database queries.",
    suggestion: "Time to First Byte (TTFB) is a critical performance metric measured by Google. A slow server response delays all other page resources from loading. Common fixes include adding a CDN, implementing server-side caching (Redis/Memcached), and optimizing database queries. Aim for TTFB under 200ms.",
    example: "// Node.js/Express: Add in-memory caching with node-cache\nconst NodeCache = require('node-cache');\nconst cache = new NodeCache({ stdTTL: 600 }); // cache for 10 min\n\napp.get('/api/data', (req, res) => {\n  const cached = cache.get(req.url);\n  if (cached) return res.json(cached);\n\n  // ... fetch from DB ...\n  const data = fetchFromDatabase();\n  cache.set(req.url, data);\n  res.json(data);\n});"
  },

  // ─── Security ────────────────────────────────────────────────────────────────
  csp_missing: {
    issue: "Missing Content-Security-Policy (CSP) header",
    severity: "High",
    solution: "Add a Content-Security-Policy HTTP response header to restrict which resources browsers can load.",
    suggestion: "CSP is one of the most effective defences against Cross-Site Scripting (XSS) and data injection attacks. It lets you create an allowlist of trusted sources for scripts, styles, images, and other resources. Start with a report-only policy to catch violations before enforcing.",
    example: "# Nginx — add inside server {} block\nadd_header Content-Security-Policy \"default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none';\" always;\n\n# Apache — add to .htaccess\nHeader always set Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\"\n\n# Node.js/Express — using the helmet package\nconst helmet = require('helmet');\napp.use(helmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: [\"'self'\"],\n    scriptSrc: [\"'self'\"],\n    objectSrc: [\"'none'\"],\n    frameAncestors: [\"'none'\"]\n  }\n}));"
  },

  hsts_missing: {
    issue: "Missing HTTP Strict-Transport-Security (HSTS) header",
    severity: "High",
    solution: "Add a Strict-Transport-Security header to force browsers to use HTTPS for all future visits.",
    suggestion: "HSTS prevents protocol-downgrade attacks and cookie hijacking by instructing browsers to only connect over HTTPS even if the user types 'http://'. Once set, the browser remembers for the duration of 'max-age'. Consider adding 'includeSubDomains' and 'preload' once you're confident HTTPS works everywhere.",
    example: "# Nginx\nadd_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;\n\n# Apache .htaccess\nHeader always set Strict-Transport-Security \"max-age=31536000; includeSubDomains\"\n\n# Node.js/Express — using the helmet package\nconst helmet = require('helmet');\napp.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));"
  },

  x_frame_missing: {
    issue: "Missing X-Frame-Options header (clickjacking risk)",
    severity: "High",
    solution: "Add the X-Frame-Options: DENY or SAMEORIGIN header to prevent your site from being embedded in iframes on other domains.",
    suggestion: "Without this header, attackers can embed your site in a hidden iframe and trick users into clicking buttons or links they cannot see — known as clickjacking. DENY prevents all framing; SAMEORIGIN allows your own domain only. Modern browsers prefer the CSP 'frame-ancestors' directive, but X-Frame-Options provides broad legacy support.",
    example: "# Nginx\nadd_header X-Frame-Options \"DENY\" always;\n\n# Apache .htaccess\nHeader always set X-Frame-Options \"SAMEORIGIN\"\n\n# Node.js/Express — using helmet\nconst helmet = require('helmet');\napp.use(helmet.frameguard({ action: 'deny' }));"
  },

  x_content_type_missing: {
    issue: "Missing X-Content-Type-Options header",
    severity: "Warning",
    solution: "Add the X-Content-Type-Options: nosniff header to prevent MIME-type sniffing attacks.",
    suggestion: "Without this header, browsers may try to 'sniff' the content type and execute a resource as a different type than declared (e.g., serving a text file as JavaScript). This can lead to XSS. Setting 'nosniff' forces the browser to honour the declared Content-Type.",
    example: "# Nginx\nadd_header X-Content-Type-Options \"nosniff\" always;\n\n# Apache .htaccess\nHeader always set X-Content-Type-Options \"nosniff\"\n\n# Node.js/Express — using helmet\nconst helmet = require('helmet');\napp.use(helmet.noSniff());"
  },

  referrer_policy_missing: {
    issue: "Missing Referrer-Policy header",
    severity: "Info",
    solution: "Add a Referrer-Policy header to control how much referrer information is sent with requests.",
    suggestion: "Without a Referrer-Policy, browsers default to sending the full URL as the Referer header, which can leak sensitive URL parameters (e.g., session tokens, user IDs) to third-party sites. 'strict-origin-when-cross-origin' is the recommended value — it sends the origin only for cross-site requests, preserving analytics accuracy.",
    example: "# Nginx\nadd_header Referrer-Policy \"strict-origin-when-cross-origin\" always;\n\n# Apache .htaccess\nHeader always set Referrer-Policy \"strict-origin-when-cross-origin\"\n\n# HTML meta tag (client-side fallback)\n<meta name=\"referrer\" content=\"strict-origin-when-cross-origin\" />"
  },

  permissions_policy_missing: {
    issue: "Missing Permissions-Policy header",
    severity: "Info",
    solution: "Add a Permissions-Policy header to restrict access to browser features like camera, microphone, and geolocation.",
    suggestion: "The Permissions-Policy header (formerly Feature-Policy) lets you control which browser APIs third-party scripts or iframes are allowed to use. Restricting unused features reduces your attack surface — if a script is compromised, it cannot access the camera or location without explicit permission.",
    example: "# Nginx\nadd_header Permissions-Policy \"camera=(), microphone=(), geolocation=(), payment=()\" always;\n\n# Apache .htaccess\nHeader always set Permissions-Policy \"camera=(), microphone=(), geolocation=()\"\n\n# Node.js/Express — using helmet\nconst helmet = require('helmet');\napp.use(helmet.permittedCrossDomainPolicies());\n// or manually:\napp.use((req, res, next) => {\n  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');\n  next();\n});"
  },

  server_header_exposed: {
    issue: "Server/X-Powered-By headers expose technology stack",
    severity: "Warning",
    solution: "Remove or obfuscate the Server and X-Powered-By HTTP headers to avoid disclosing your technology stack.",
    suggestion: "Revealing the exact server software and version (e.g., 'Apache/2.4.51', 'PHP/8.1.0') gives attackers a free head-start — they can look up known CVEs for that exact version and target your site specifically. Removing these headers is a quick, low-effort hardening step.",
    example: "# Apache — hide version in httpd.conf or apache2.conf\nServerTokens Prod\nServerSignature Off\n\n# Nginx — nginx.conf\nserver_tokens off;\n\n# Node.js/Express — helmet removes X-Powered-By\nconst helmet = require('helmet');\napp.use(helmet());\n// Or manually:\napp.disable('x-powered-by');"
  },

  mixed_content: {
    issue: "Mixed content — HTTP resources loaded on an HTTPS page",
    severity: "Critical",
    solution: "Update all resource URLs (images, scripts, stylesheets, iframes) to use HTTPS instead of HTTP.",
    suggestion: "Loading HTTP sub-resources on an HTTPS page breaks the security model. Modern browsers block active mixed content (scripts, iframes) outright and warn about passive mixed content (images, audio). This can break site functionality, remove the padlock icon, and expose users to man-in-the-middle attacks on those resources.",
    example: "<!-- WRONG: HTTP resource on HTTPS page -->\n<img src=\"http://example.com/photo.jpg\" alt=\"Photo\" />\n<script src=\"http://cdn.example.com/lib.js\"></script>\n\n<!-- CORRECT: Use HTTPS -->\n<img src=\"https://example.com/photo.jpg\" alt=\"Photo\" />\n<script src=\"https://cdn.example.com/lib.js\"></script>\n\n<!-- Or use protocol-relative URLs (inherits page protocol) -->\n<img src=\"//example.com/photo.jpg\" alt=\"Photo\" />"
  },

  inline_event_handlers: {
    issue: "Inline JavaScript event handlers detected (XSS risk)",
    severity: "Warning",
    solution: "Remove inline event handlers (onclick, onload, etc.) and attach JavaScript event listeners programmatically instead.",
    suggestion: "Inline event handlers like onclick=\"doSomething()\" significantly increase the risk of XSS because they require your CSP to allow 'unsafe-inline', effectively neutralising it. Moving event listeners to external JS files makes your site CSP-compatible and keeps behaviour separate from markup.",
    example: "<!-- WRONG: Inline handler -->\n<button onclick=\"submitForm()\">Submit</button>\n\n<!-- CORRECT: Attach listener in JS -->\n<button id=\"submit-btn\">Submit</button>\n\n<script>\n  // In your external .js file:\n  document.getElementById('submit-btn')\n    .addEventListener('click', submitForm);\n\n  function submitForm() {\n    // form logic here\n  }\n</script>"
  },

  open_redirect_risk: {
    issue: "External links open in new tab without rel=\"noopener noreferrer\"",
    severity: "Warning",
    solution: "Add rel=\"noopener noreferrer\" to all <a target=\"_blank\"> links pointing to external sites.",
    suggestion: "Without rel=\"noopener\", the newly opened page can access and manipulate your page via window.opener — a technique called reverse tabnapping. The opened page could redirect your original tab to a phishing site. Adding noopener removes this reference. noreferrer also prevents passing the referrer URL to the target.",
    example: "<!-- WRONG: Vulnerable to tabnapping -->\n<a href=\"https://external-site.com\" target=\"_blank\">Visit Site</a>\n\n<!-- CORRECT: Safe external link -->\n<a href=\"https://external-site.com\" target=\"_blank\" rel=\"noopener noreferrer\">\n  Visit Site\n</a>"
  }
};

exports.generateRecommendations = (issues) => {
  return issues.map(issue => {
    const rec = recommendationsMap[issue.id] ? { ...recommendationsMap[issue.id] } : {
      issue: "Unknown issue",
      severity: "Info",
      solution: "Review the page for potential improvements.",
      suggestion: null,
      example: null
    };
    
    // Inject details if any
    if (issue.details) {
      if (issue.id === 'images_missing_alt') {
        rec.issue = `${issue.details.count} images missing alt attributes`;
      } else if (issue.id === 'response_time_slow') {
        rec.issue = `Slow server response time (${issue.details.responseTime}ms)`;
      } else if (issue.id === 'mixed_content') {
        rec.issue = `Mixed content: ${issue.details.count} insecure resources found`;
      } else if (issue.id === 'server_header_exposed') {
        const exposed = [issue.details.server, issue.details.poweredBy].filter(Boolean).join(', ');
        rec.issue = `Vulnerable headers exposed technology stack (${exposed})`;
      } else if (issue.id === 'inline_event_handlers') {
        rec.issue = `${issue.details.count} inline JS event handlers found (XSS risk)`;
      } else if (issue.id === 'open_redirect_risk') {
        rec.issue = `${issue.details.count} unsafe external links found (noopener missing)`;
      }
    }
    
    return {
      type: issue.type,
      ...rec
    };
  });
};
