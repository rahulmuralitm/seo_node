const express = require('express');
const router = express.Router();

/**
 * Mock AI responses - Replace with actual AI API integration (OpenAI, Claude, etc.)
 */
const responses = {
  greetings: [
    "Hello! I'm your SEO & Security AI Assistant. I can help you understand and improve your audit findings. What would you like to discuss?",
    "Welcome! I'm here to explain your audit results and help you address any security or SEO issues. Feel free to ask me anything!",
    "Hi there! I can help you dive deeper into your audit findings and provide recommendations. What's on your mind?"
  ],
  seo: [
    "To improve your SEO score, focus on:\n1. Optimizing your meta descriptions\n2. Adding more internal links\n3. Improving page load speed\n4. Creating quality content with proper heading hierarchy",
    "SEO improvements I recommend:\n- Ensure all images have alt text\n- Use semantic HTML tags\n- Optimize your site structure\n- Create more content around your target keywords"
  ],
  security: [
    "Security is crucial for your site. Key recommendations:\n1. Add security headers (X-Frame-Options, X-Content-Type-Options)\n2. Implement HTTPS everywhere\n3. Keep dependencies updated\n4. Use a Content Security Policy (CSP)\n5. Sanitize user inputs",
    "To enhance your site security:\n- Review and update your Content Security Policy\n- Check for outdated packages\n- Implement proper input validation\n- Add security headers to your responses"
  ],
  csp: [
    "Content Security Policy (CSP) is a security mechanism that helps prevent XSS attacks and data injection. A good CSP policy:\n- Restricts script sources\n- Controls font and style sources\n- Limits frame embedding\n- Requires strict-dynamic for inline scripts when possible",
    "Your CSP policy should include directives for:\n- default-src: Default source for all resources\n- script-src: Only allow scripts from trusted sources\n- style-src: Control stylesheet sources\n- img-src: Limit image sources\n- font-src: Restrict font sources"
  ],
  performance: [
    "To improve performance:\n1. Optimize images (use WebP, compress)\n2. Minimize CSS/JS files\n3. Enable gzip compression\n4. Use a CDN\n5. Implement lazy loading\n6. Reduce server response time",
    "Performance tips:\n- Check Time to First Byte (TTFB)\n- Implement efficient caching strategies\n- Minimize render-blocking resources\n- Use async/defer for scripts"
  ]
};

/**
 * Helper function to categorize and get relevant response
 */
function getAIResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('seo') || lowerMessage.includes('score') || lowerMessage.includes('improve')) {
    return responses.seo[Math.floor(Math.random() * responses.seo.length)];
  } else if (lowerMessage.includes('security') || lowerMessage.includes('secure') || lowerMessage.includes('ssl')) {
    return responses.security[Math.floor(Math.random() * responses.security.length)];
  } else if (lowerMessage.includes('csp') || lowerMessage.includes('content security')) {
    return responses.csp[Math.floor(Math.random() * responses.csp.length)];
  } else if (lowerMessage.includes('performance') || lowerMessage.includes('speed') || lowerMessage.includes('fast')) {
    return responses.performance[Math.floor(Math.random() * responses.performance.length)];
  } else {
    // Generic response for other queries
    return "That's a great question! Based on your audit results, I can help you with:\n- SEO optimization\n- Security enhancements\n- CSP policy improvements\n- Performance optimization\n\nFeel free to ask about any of these topics!";
  }
}

/**
 * POST /api/chatbot/chat - Send a message to the chatbot
 */
router.post('/chat', (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message' });
    }

    // Generate AI response based on message and context
    const reply = getAIResponse(message);

    res.json({
      reply,
      suggestions: [
        'Tell me more',
        'How to implement this?',
        'What are the best practices?'
      ]
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/chatbot/greeting - Get initial greeting
 */
router.post('/greeting', (req, res) => {
  try {
    const { context } = req.body;
    
    // Customize greeting based on audit data
    let greeting = responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
    
    if (context?.seoScore) {
      if (context.seoScore >= 80) {
        greeting += "\n\nGreat job on your SEO score! We can still find some areas to optimize.";
      } else if (context.seoScore >= 60) {
        greeting += "\n\nYour SEO score has potential. Let me help you identify key improvements.";
      } else {
        greeting += "\n\nYour SEO needs some work. Let's discuss how we can improve it together.";
      }
    }

    res.json({ reply: greeting });
  } catch (error) {
    console.error('Greeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/chatbot/suggestions/:type/:id - Get suggestions for a specific finding
 */
router.get('/suggestions/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;

    let suggestions = [];

    if (type === 'seo') {
      suggestions = responses.seo;
    } else if (type === 'security') {
      suggestions = responses.security;
    } else if (type === 'csp') {
      suggestions = responses.csp;
    }

    const suggestion = suggestions.length > 0 
      ? suggestions[Math.floor(Math.random() * suggestions.length)]
      : 'I can help with that! Could you provide more details?';

    res.json({ reply: suggestion });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
