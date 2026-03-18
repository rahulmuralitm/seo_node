const fetchService = require('../services/fetchService');
const analyzerService = require('../services/analyzerService');
const scoring = require('../utils/scoring');
const recommendationEngine = require('../utils/recommendations');

exports.scanWebsite = async (req, res) => {
  try {
    console.log(req.body);

    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Valid URL is required.' });
    }

    // Fetch HTML
    const fetchResult = await fetchService.fetchHtml(url);
    if (!fetchResult.success) {
      return res.status(500).json({ error: 'Failed to fetch the website.' });
    }

    const { html, pageSize, responseTime, headers, finalUrl } = fetchResult;

    // Analyze HTML
    const analysis = analyzerService.analyze(html, finalUrl, pageSize, responseTime, headers);

    // Calculate Score
    const resultScore = scoring.calculateScore(analysis);

    // Generate Recommendations
    const recommendations = recommendationEngine.generateRecommendations(analysis.issues);

    res.json({
      seoScore: resultScore,
      summary: analysis.summary,
      issues: analysis.issues,
      cspPolicy: analysis.cspPolicy,
      cspReport: analysis.cspReport,
      siteMap: analysis.siteMap,
      recommendations
    });
  } catch (error) {
    console.error('Error during scan:', error);
    res.status(500).json({ error: 'An unexpected error occurred during the scan.' });
  }
};
