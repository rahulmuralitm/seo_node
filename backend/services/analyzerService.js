const cheerio = require('cheerio');

// Basic CSP analysis / warnings used to mirror CSP validator style output.
const cspWarnings = {
  hostAllowlist: {
    id: 'script-src-host-allowlist',
    type: 'error',
    title: "Host allowlists can frequently be bypassed.",
    message: "Consider using 'strict-dynamic' in combination with CSP nonces or hashes.",
  },
  selfInScript: {
    id: 'script-src-self',
    type: 'help',
    title: "'self'",
    message: "'self' can be problematic if you host JSONP, AngularJS or user uploaded files.",
  },
  unsafeInline: {
    id: 'script-src-unsafe-inline',
    type: 'error',
    title: "'unsafe-inline'",
    message: "'unsafe-inline' allows the execution of unsafe in-page scripts and event handlers.",
  },
  unsafeEval: {
    id: 'script-src-unsafe-eval',
    type: 'help',
    title: "'unsafe-eval'",
    message: "'unsafe-eval' allows the execution of code injected into DOM APIs such as eval().",
  }
};

const knownBypassHosts = {
  'https://accounts.google.com': "accounts.google.com is known to host JSONP endpoints which allow to bypass this CSP.",
  'https://cdnjs.cloudflare.com': "cdnjs.cloudflare.com is known to host Angular libraries which allow to bypass this CSP.",
};

const parseCspDirectives = (policy) => {
  const directives = {};
  policy.split(';').forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const [name, ...values] = trimmed.split(/\s+/);
    directives[name] = values;
  });
  return directives;
};

const buildCspReport = (policy) => {
  const directives = parseCspDirectives(policy);
  const report = [];

  const addDirective = (name, status, notes = []) => {
    report.push({ directive: name, status, notes });
  };

  const checkDirective = (name) => {
    if (!directives[name]) {
      addDirective(name, 'missing', [{ type: 'info', message: `Missing ${name} directive.` }]);
      return null;
    }
    addDirective(name, 'ok');
    return directives[name];
  };

  checkDirective('default-src');
  checkDirective('frame-ancestors');
  checkDirective('frame-src');
  checkDirective('style-src');

  const scriptValues = checkDirective('script-src');
  if (scriptValues) {
    // If it contains any host allowlist besides 'self' and 'nonce-'/'sha', show warning.
    const hasHostAllowlist = scriptValues.some(v => {
      if (v === "'self'" || v.startsWith("'nonce-") || v.startsWith("'sha")) return false;
      if (v.startsWith('http') || v.includes('.')) return true;
      return false;
    });
    if (hasHostAllowlist) {
      addDirective('script-src-host-allowlist', 'error', [{ type: 'error', ...cspWarnings.hostAllowlist }]);
      scriptValues.forEach(v => {
        if (knownBypassHosts[v]) {
          addDirective(v, 'error', [{ type: 'error', title: v, message: knownBypassHosts[v] }]);
        } else if (v.startsWith('http')) {
          addDirective(v, 'help', [{ type: 'help', title: v, message: `No bypass found; make sure that this URL doesn't serve JSONP replies or Angular libraries.` }]);
        }
      });
    }
    if (scriptValues.includes("'self'")) {
      addDirective('script-src-self', 'help', [{ type: 'help', ...cspWarnings.selfInScript }]);
    }
    if (scriptValues.includes("'unsafe-inline'")) {
      addDirective('script-src-unsafe-inline', 'error', [{ type: 'error', ...cspWarnings.unsafeInline }]);
    }
    if (scriptValues.includes("'unsafe-eval'")) {
      addDirective('script-src-unsafe-eval', 'help', [{ type: 'help', ...cspWarnings.unsafeEval }]);
    }
  }

  checkDirective('img-src');
  checkDirective('font-src');
  checkDirective('connect-src');
  checkDirective('base-uri');

  // Trusted Types recommendation
  if (!directives['require-trusted-types-for']) {
    report.push({
      directive: 'require-trusted-types-for',
      status: 'info',
      notes: [{
        type: 'info',
        title: 'require-trusted-types-for [missing]',
        message: "Consider requiring Trusted Types for scripts to lock down DOM XSS injection sinks. You can do this by adding \"require-trusted-types-for 'script'\" to your policy."
      }]
    });
  }

  return report;
};

const generateSiteMap = ($, url, summary) => {
  const siteMap = {
    totalPages: 0,
    pages: [],
    brokenLinks: [],
    xmlSitemap: '',
    htmlSitemap: '',
    imageSitemap: '',
    sitemapIndex: '',
    robotsTxt: '',
    statistics: {
      totalUrls: 0,
      internalLinks: 0,
      externalLinks: 0,
      images: 0,
      videos: 0,
      documents: 0
    }
  };

  try {
    // Extract base URL and domain info
    const baseUrl = new URL(url).origin;
    const domain = new URL(url).hostname;

    // Common page patterns found on most websites
    const commonPages = [
      '/', '/home', '/index', '/index.html',
      '/about', '/about-us', '/aboutus', '/company',
      '/contact', '/contact-us', '/contactus',
      '/services', '/products', '/portfolio',
      '/blog', '/news', '/articles', '/resources',
      '/faq', '/help', '/support',
      '/privacy', '/privacy-policy', '/terms', '/terms-of-service',
      '/sitemap', '/sitemap.xml', '/sitemap.html',
      '/login', '/register', '/signup', '/signin',
      '/dashboard', '/profile', '/account',
      '/careers', '/jobs', '/team'
    ];

    // Get all internal links from the page
    const discoveredLinks = new Set();
    const externalLinks = new Set();
    const images = new Set();
    const videos = new Set();
    const documents = new Set();

    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
          if (fullUrl.startsWith(baseUrl)) {
            discoveredLinks.add(fullUrl);
          } else {
            externalLinks.add(fullUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    // Extract images
    $('img[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        try {
          const fullSrc = src.startsWith('http') ? src : new URL(src, baseUrl).href;
          images.add(fullSrc);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    // Extract videos
    $('video source, video[src]').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('source');
      if (src) {
        try {
          const fullSrc = src.startsWith('http') ? src : new URL(src, baseUrl).href;
          videos.add(fullSrc);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    // Extract documents (PDFs, docs, etc.)
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.endsWith('.pdf') || href.endsWith('.doc') || href.endsWith('.docx') ||
          href.endsWith('.xls') || href.endsWith('.xlsx') || href.endsWith('.ppt') ||
          href.endsWith('.pptx'))) {
        try {
          const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
          documents.add(fullUrl);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    // Add current page and common pages
    const allPages = new Set([url, ...discoveredLinks]);

    // Add common pages that might exist
    commonPages.forEach(page => {
      try {
        const pageUrl = new URL(page, baseUrl).href;
        // Only add if it's not already discovered and is internal
        if (pageUrl.startsWith(baseUrl) && !Array.from(allPages).some(existing =>
          existing === pageUrl || existing === pageUrl.replace(/\/$/, '') ||
          pageUrl === existing.replace(/\/$/, ''))) {
          allPages.add(pageUrl);
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });

    // Convert to array and create page objects with enhanced metadata
    siteMap.pages = Array.from(allPages).map(linkUrl => {
      const isHomePage = linkUrl === url || linkUrl === baseUrl || linkUrl === baseUrl + '/';
      const path = linkUrl.replace(baseUrl, '') || '/';
      const pathSegments = path.split('/').filter(p => p);

      // Determine page type and priority
      let pageType = 'page';
      let priority = 0.5;
      let changefreq = 'monthly';

      if (isHomePage) {
        pageType = 'homepage';
        priority = 1.0;
        changefreq = 'daily';
      } else if (pathSegments.includes('blog') || pathSegments.includes('news') || pathSegments.includes('articles')) {
        pageType = 'blog';
        priority = 0.8;
        changefreq = 'weekly';
      } else if (pathSegments.includes('about') || pathSegments.includes('contact') || pathSegments.includes('services')) {
        pageType = 'important';
        priority = 0.9;
        changefreq = 'monthly';
      } else if (pathSegments.includes('privacy') || pathSegments.includes('terms') || pathSegments.includes('faq')) {
        pageType = 'legal';
        priority = 0.3;
        changefreq = 'yearly';
      }

      // Extract title from HTML if available
      let title = 'Page';
      if (isHomePage && summary.title) {
        title = summary.title;
      } else if (pathSegments.length > 0) {
        title = pathSegments[pathSegments.length - 1]
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }

      return {
        url: linkUrl,
        title: title,
        status: '200', // Mock status - in real implementation, would check actual status
        lastModified: new Date().toISOString().split('T')[0],
        priority: priority,
        changefreq: changefreq,
        type: pageType,
        path: path,
        discovered: discoveredLinks.has(linkUrl)
      };
    });

    siteMap.totalPages = siteMap.pages.length;

    // Update statistics
    siteMap.statistics = {
      totalUrls: siteMap.pages.length,
      internalLinks: discoveredLinks.size,
      externalLinks: externalLinks.size,
      images: images.size,
      videos: videos.size,
      documents: documents.size
    };

    // Generate XML sitemap
    siteMap.xmlSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    siteMap.xmlSitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    siteMap.pages.forEach(page => {
      siteMap.xmlSitemap += '  <url>\n';
      siteMap.xmlSitemap += `    <loc>${page.url}</loc>\n`;
      siteMap.xmlSitemap += `    <lastmod>${page.lastModified}</lastmod>\n`;
      siteMap.xmlSitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      siteMap.xmlSitemap += `    <priority>${page.priority}</priority>\n`;
      siteMap.xmlSitemap += '  </url>\n';
    });

    siteMap.xmlSitemap += '</urlset>';

    // Generate HTML sitemap
    siteMap.htmlSitemap = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Sitemap - ${domain}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        .section { margin: 30px 0; }
        .section h2 { color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .page-list { list-style: none; padding: 0; }
        .page-list li { margin: 8px 0; padding: 8px; border-radius: 4px; background: #f9f9f9; }
        .page-list a { text-decoration: none; color: #007acc; }
        .page-list a:hover { text-decoration: underline; }
        .stats { background: #e8f4fd; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .stats strong { color: #007acc; }
    </style>
</head>
<body>
    <div class="container">
        <h1>HTML Sitemap - ${domain}</h1>

        <div class="stats">
            <strong>Site Statistics:</strong><br>
            Total Pages: ${siteMap.statistics.totalUrls} |
            Internal Links: ${siteMap.statistics.internalLinks} |
            External Links: ${siteMap.statistics.externalLinks} |
            Images: ${siteMap.statistics.images} |
            Documents: ${siteMap.statistics.documents}
        </div>`;

    // Group pages by type
    const groupedPages = siteMap.pages.reduce((groups, page) => {
      if (!groups[page.type]) groups[page.type] = [];
      groups[page.type].push(page);
      return groups;
    }, {});

    Object.keys(groupedPages).forEach(type => {
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + ' Pages';
      siteMap.htmlSitemap += `
        <div class="section">
            <h2>${typeLabel} (${groupedPages[type].length})</h2>
            <ul class="page-list">`;

      groupedPages[type].forEach(page => {
        const discoveredBadge = page.discovered ? ' <small style="color: #666;">(discovered)</small>' : ' <small style="color: #999;">(suggested)</small>';
        siteMap.htmlSitemap += `
                <li><a href="${page.url}">${page.title}</a>${discoveredBadge}</li>`;
      });

      siteMap.htmlSitemap += `
            </ul>
        </div>`;
    });

    siteMap.htmlSitemap += `
    </div>
</body>
</html>`;

    // Generate Image Sitemap
    if (images.size > 0) {
      siteMap.imageSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      siteMap.imageSitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

      siteMap.pages.forEach(page => {
        siteMap.imageSitemap += '  <url>\n';
        siteMap.imageSitemap += `    <loc>${page.url}</loc>\n`;
        // Add images found on this page (simplified - in real implementation, would track which images are on which pages)
        Array.from(images).slice(0, 10).forEach(imgSrc => { // Limit to 10 images per page for sitemap
          siteMap.imageSitemap += '    <image:image>\n';
          siteMap.imageSitemap += `      <image:loc>${imgSrc}</image:loc>\n`;
          siteMap.imageSitemap += '    </image:image>\n';
        });
        siteMap.imageSitemap += '  </url>\n';
      });

      siteMap.imageSitemap += '</urlset>';
    }

    // Generate Sitemap Index if we have multiple sitemaps
    const sitemaps = [];
    sitemaps.push({ type: 'pages', url: `${baseUrl}/sitemap.xml`, lastmod: new Date().toISOString() });
    if (siteMap.imageSitemap) {
      sitemaps.push({ type: 'images', url: `${baseUrl}/sitemap-images.xml`, lastmod: new Date().toISOString() });
    }

    if (sitemaps.length > 1) {
      siteMap.sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n';
      siteMap.sitemapIndex += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      sitemaps.forEach(sitemap => {
        siteMap.sitemapIndex += '  <sitemap>\n';
        siteMap.sitemapIndex += `    <loc>${sitemap.url}</loc>\n`;
        siteMap.sitemapIndex += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
        siteMap.sitemapIndex += '  </sitemap>\n';
      });

      siteMap.sitemapIndex += '</sitemapindex>';
    }

    // Generate robots.txt
    siteMap.robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
${siteMap.imageSitemap ? `Sitemap: ${baseUrl}/sitemap-images.xml` : ''}

# Crawl delay (optional)
Crawl-delay: 1

# Disallow certain paths (examples)
# Disallow: /admin/
# Disallow: /private/
# Disallow: /temp/`;

    // Check for broken links (mock implementation)
    siteMap.brokenLinks = [];

  } catch (error) {
    console.error('Error generating site map:', error);
    // Return minimal site map on error
    siteMap.pages = [{
      url: url,
      title: summary.title || 'Home Page',
      status: '200',
      lastModified: new Date().toISOString().split('T')[0],
      priority: 1.0,
      changefreq: 'daily',
      type: 'homepage',
      path: '/',
      discovered: true
    }];
    siteMap.totalPages = 1;
  }

  return siteMap;
};

exports.analyze = (html, url, pageSize, responseTime, headers = {}) => {
  const $ = cheerio.load(html);

  // Helper to get lowercased header value
  const h = key => (headers[key] || '').toLowerCase();

  const analysis = {
    summary: {
      url,
      pageSize,
      responseTime,
      title: $('title').text(),
    },
    issues: []
  };

  // ─── Technical SEO ─────────────────────────────────────────────────────────
  const isHttps = url.startsWith('https://');
  if (!isHttps) analysis.issues.push({ id: 'https_missing', type: 'Technical SEO' });

  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) analysis.issues.push({ id: 'canonical_missing', type: 'Technical SEO' });

  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) analysis.issues.push({ id: 'viewport_missing', type: 'Mobile Optimization' });

  const htmlLang = $('html').attr('lang');
  if (!htmlLang) analysis.issues.push({ id: 'html_lang_missing', type: 'Technical SEO' });

  // Robots check (Meta tag + HTTP Header)
  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  const xRobotsHeader = h('x-robots-tag');
  if (robotsMeta.toLowerCase().includes('noindex') || xRobotsHeader.includes('noindex')) {
    analysis.issues.push({ id: 'robots_noindex', type: 'Technical SEO' });
  }

  const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
  if (!favicon) analysis.issues.push({ id: 'favicon_missing', type: 'Technical SEO' });

  // ─── Meta Tags ──────────────────────────────────────────────────────────────
  const title = $('title').text();
  if (!title) analysis.issues.push({ id: 'title_missing', type: 'Meta Tags' });
  else if (title.length < 30 || title.length > 60) analysis.issues.push({ id: 'title_length', type: 'Meta Tags' });

  const metaDesc = $('meta[name="description"]').attr('content');
  if (!metaDesc) analysis.issues.push({ id: 'meta_desc_missing', type: 'Meta Tags' });
  else if (metaDesc.length < 120 || metaDesc.length > 160) analysis.issues.push({ id: 'meta_desc_length', type: 'Meta Tags' });

  const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content');
  if (!ogTitle || !ogDesc || !ogImage) {
    analysis.issues.push({ id: 'og_tags_missing', type: 'Meta Tags' });
  }

  // ─── Headings ───────────────────────────────────────────────────────────────
  const h1s = $('h1');
  if (h1s.length === 0) analysis.issues.push({ id: 'h1_missing', type: 'Headings' });
  if (h1s.length > 1) analysis.issues.push({ id: 'h1_multiple', type: 'Headings' });

  analysis.summary.h1Count = h1s.length;
  analysis.summary.h2Count = $('h2').length;

  // ─── Images ─────────────────────────────────────────────────────────────────
  const images = $('img');
  let missingAlt = 0;
  images.each((i, img) => {
    if (!$(img).attr('alt')) missingAlt++;
  });

  if (missingAlt > 0) analysis.issues.push({ id: 'images_missing_alt', type: 'Images', details: { count: missingAlt } });

  analysis.summary.totalImages = images.length;

  // ─── Links ──────────────────────────────────────────────────────────────────
  const links = $('a');
  let internalLinks = 0;
  let externalLinks = 0;
  
  let origin = '';
  try {
    origin = new URL(url).origin;
  } catch (e) {
    origin = '';
  }

  links.each((i, link) => {
    const href = $(link).attr('href');
    if (href) {
      if (href.startsWith(origin) || href.startsWith('/')) {
        internalLinks++;
      } else if (href.startsWith('http')) {
        externalLinks++;
      }
    }
  });

  if (internalLinks === 0) analysis.issues.push({ id: 'internal_links_missing', type: 'Links' });
  if (externalLinks === 0) analysis.issues.push({ id: 'external_links_missing', type: 'Links' });

  analysis.summary.internalLinks = internalLinks;
  analysis.summary.externalLinks = externalLinks;

  // ─── Content ────────────────────────────────────────────────────────────────
  const textContent = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').length;
  if (wordCount < 300) analysis.issues.push({ id: 'low_word_count', type: 'Content' });

  analysis.summary.wordCount = wordCount;

  // ─── Performance ────────────────────────────────────────────────────────────
  if (pageSize > 3 * 1024 * 1024) analysis.issues.push({ id: 'page_size_large', type: 'Performance' });
  if (responseTime > 2000) analysis.issues.push({ id: 'response_time_slow', type: 'Performance', details: { responseTime } });

  // ─── Security ───────────────────────────────────────────────────────────────
  // 1. Content-Security-Policy
  if (!h('content-security-policy')) {
    analysis.issues.push({ id: 'csp_missing', type: 'Security' });
  }

  // 2. HTTP Strict Transport Security (only relevant for HTTPS sites)
  if (isHttps && !h('strict-transport-security')) {
    analysis.issues.push({ id: 'hsts_missing', type: 'Security' });
  }

  // 3. Clickjacking protection
  const cspVal = h('content-security-policy');
  if (!h('x-frame-options') && !cspVal.includes('frame-ancestors')) {
    analysis.issues.push({ id: 'x_frame_missing', type: 'Security' });
  }

  // 4. MIME-type sniffing protection
  if (h('x-content-type-options') !== 'nosniff') {
    analysis.issues.push({ id: 'x_content_type_missing', type: 'Security' });
  }

  // 5. Referrer-Policy
  if (!h('referrer-policy')) {
    analysis.issues.push({ id: 'referrer_policy_missing', type: 'Security' });
  }

  // 6. Permissions-Policy (formerly Feature-Policy)
  if (!h('permissions-policy') && !h('feature-policy')) {
    analysis.issues.push({ id: 'permissions_policy_missing', type: 'Security' });
  }

  // 7. Tech-stack disclosure via Server / X-Powered-By headers
  const serverHeader = h('server');
  const poweredByHeader = h('x-powered-by');
  const disclosurePattern = /(apache|nginx|iis|litespeed|php|express|django|rails|version|\d+\.\d+)/i;
  if (disclosurePattern.test(serverHeader) || disclosurePattern.test(poweredByHeader)) {
    analysis.issues.push({
      id: 'server_header_exposed',
      type: 'Security',
      details: {
        server: serverHeader || undefined,
        poweredBy: poweredByHeader || undefined
      }
    });
  }

  // Provide the raw Content-Security-Policy header value (if present),
  // otherwise return a recommended CSP string (usable in https://csp-evaluator.withgoogle.com/)
  const rawCsp = headers['content-security-policy'] || '';
  analysis.cspPolicy = rawCsp ||
    `default-src 'self';\n` +
    `frame-ancestors 'self';\n` +
    `frame-src 'self' https://accounts.google.com;\n` +
    `style-src 'self' https://fonts.googleapis.com https://stackpath.bootstrapcdn.com https://cdnjs.cloudflare.com https://accounts.google.com 'unsafe-inline';\n` +
    `script-src 'self' https://accounts.google.com https://wc.io-market.net https://code.jquery.com https://cdnjs.cloudflare.com https://stackpath.bootstrapcdn.com 'unsafe-inline' 'unsafe-eval';\n` +
    `img-src 'self' https://wc.io-market.net data:;\n` +
    `font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://stackpath.bootstrapcdn.com;\n` +
    `connect-src 'self' https://stackpath.bootstrapcdn.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://*.io-market.net https://*.gate2b.net https://*.dmh.gate2b.net;\n` +
    `base-uri 'self';`;

  // Add CSP report in validator-style format
  analysis.cspReport = buildCspReport(analysis.cspPolicy);

  // 8. Mixed content – HTTP sub-resources on an HTTPS page
  if (isHttps) {
    let mixedContentCount = 0;
    $('img[src], script[src], link[href], iframe[src], audio[src], video[src], source[src]').each((i, el) => {
      const attrVal = $(el).attr('src') || $(el).attr('href') || '';
      if (attrVal.startsWith('http://')) mixedContentCount++;
    });
    if (mixedContentCount > 0) {
      analysis.issues.push({ id: 'mixed_content', type: 'Security', details: { count: mixedContentCount } });
    }
  }

  // 9. Inline event handlers (XSS attack surface)
  const inlineEventAttrs = ['onclick', 'onmouseover', 'onmouseout', 'onload', 'onerror',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeyup', 'onkeydown', 'onkeypress'];
  let inlineHandlerCount = 0;
  $('*').each((i, el) => {
    for (const attr of inlineEventAttrs) {
      if ($(el).attr(attr) !== undefined) {
        inlineHandlerCount++;
        break; // Count per element
      }
    }
  });
  if (inlineHandlerCount > 0) {
    analysis.issues.push({ id: 'inline_event_handlers', type: 'Security', details: { count: inlineHandlerCount } });
  }

  // 10. External links missing rel="noopener"
  let unsafeExternalLinks = 0;
  $('a[target="_blank"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    const rel = ($(el).attr('rel') || '').toLowerCase();
    if (href.startsWith('http') && !rel.includes('noopener')) {
      unsafeExternalLinks++;
    }
  });
  if (unsafeExternalLinks > 0) {
    analysis.issues.push({ id: 'open_redirect_risk', type: 'Security', details: { count: unsafeExternalLinks } });
  }

  // Summary security stats
  analysis.summary.securityIssues = analysis.issues.filter(i => i.type === 'Security').length;

  // ─── CSP Analysis ───────────────────────────────────────────────────────────
  const cspHeader = headers['content-security-policy'] || headers['content-security-policy-report-only'] || '';
  if (cspHeader) {
    analysis.cspPolicy = cspHeader;
    analysis.cspReport = buildCspReport(cspHeader);
  } else {
    // Generate a recommended CSP policy
    const recommendedCsp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';";
    analysis.cspPolicy = recommendedCsp;
    analysis.cspReport = buildCspReport(recommendedCsp);
  }

  // Ensure CSP data always exists
  if (!analysis.cspPolicy) {
    analysis.cspPolicy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self';";
  }
  if (!analysis.cspReport || analysis.cspReport.length === 0) {
    analysis.cspReport = [{
      directive: 'default-src',
      status: 'ok',
      notes: []
    }];
  }

  // ─── Site Map Generation ───────────────────────────────────────────────────
  analysis.siteMap = generateSiteMap($, url, analysis.summary);

  return analysis;
};
