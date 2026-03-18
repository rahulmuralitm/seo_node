exports.calculateScore = (analysis) => {
  const issues = analysis.issues.map(i => i.id);

  const checks = [
    'title_missing',
    'meta_desc_missing',
    'h1_missing',
    'images_missing_alt',
    'low_word_count',
    'https_missing',
    'viewport_missing',
    'internal_links_missing',
    'external_links_missing',
    'page_size_large',
    'html_lang_missing',
    'robots_noindex',
    'og_tags_missing',
    'favicon_missing',
    'response_time_slow',
    // Security Checks
    'csp_missing',
    'hsts_missing',
    'x_frame_missing',
    'x_content_type_missing',
    'referrer_policy_missing',
    'permissions_policy_missing',
    'server_header_exposed',
    'mixed_content',
    'inline_event_handlers',
    'open_redirect_risk'
  ];

  let passedChecks = 0;
  checks.forEach(check => {
    if (!issues.includes(check)) {
      passedChecks++;
    }
  });

  const score = (passedChecks / checks.length) * 100;
  return Math.round(score);
};
