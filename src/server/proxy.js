
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

// Enable CORS for all origins in development
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Increase request size limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root endpoint for health check
app.get('/', (req, res) => {
  res.json({ status: 'Proxy server root endpoint' });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'Proxy server is running!' });
});

// Add documentation endpoint for the DeepSeek API
app.get('/api/deepseek', (req, res) => {
  res.json({ 
    message: 'This endpoint requires a POST request with the following structure:',
    example: {
      headers: {
        'Content-Type': 'application/json',
        'X-DeepSeek-API-Key': 'your-api-key-here'
      },
      body: {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'system prompt'
          },
          {
            role: 'user',
            content: 'user text'
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      }
    }
  });
});

// Proxy endpoint for DeepSeek API
app.post('/api/deepseek', async (req, res) => {
  try {
    const deepseekApiKey = req.headers['x-deepseek-api-key'];
    if (!deepseekApiKey) {
      return res.status(400).json({ error: 'DeepSeek API key is required' });
    }

    console.log('Making request to DeepSeek API with body:', JSON.stringify(req.body, null, 2));

    // Make sure we're using the latest v3 API endpoint
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...req.body,
        // Ensure we're using the correct model name
        model: req.body.model || 'deepseek-chat'
      })
    });

    // Get the response as text first
    const textResponse = await response.text();
    console.log('Raw API Response:', textResponse);
    
    let data;
    try {
      // Then parse it as JSON
      data = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return res.status(500).json({
        error: 'Invalid JSON response from API',
        raw_response: textResponse
      });
    }
    
    // Log the response for debugging
    console.log('DeepSeek API Response:', JSON.stringify(data, null, 2));

    // Check if we got an error response
    if (data.error || data.error_msg) {
      console.error('DeepSeek API error:', data.error || data.error_msg);
      return res.status(400).json({
        error: data.error || data.error_msg,
        details: data
      });
    }

    // Check if the response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Unexpected API response structure:', data);
      return res.status(500).json({
        error: 'Invalid API response structure',
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy request to DeepSeek API',
      details: error.message,
      stack: error.stack
    });
  }
});

// Batch processing endpoint
app.post('/api/deepseek/batch', async (req, res) => {
  try {
    const deepseekApiKey = req.headers['x-deepseek-api-key'];
    if (!deepseekApiKey) {
      return res.status(400).json({ error: 'DeepSeek API key is required' });
    }
    
    const { prompts } = req.body;
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: 'A non-empty array of prompts is required' });
    }
    
    console.log(`Processing batch of ${prompts.length} prompts`);
    
    const results = [];
    
    // Process each prompt sequentially to avoid rate limiting
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`Processing prompt ${i+1}/${prompts.length}`);
      
      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            model: prompt.model || 'deepseek-chat',
            messages: prompt.messages,
            temperature: prompt.temperature || 0.2,
            max_tokens: prompt.max_tokens || 4000
          })
        });
        
        // Get the response as text first
        const textResponse = await response.text();
        
        try {
          // Then parse it as JSON
          const data = JSON.parse(textResponse);
          results.push({
            success: true,
            promptIndex: i,
            data
          });
        } catch (parseError) {
          results.push({
            success: false,
            promptIndex: i,
            error: 'Invalid JSON response',
            raw: textResponse
          });
        }
      } catch (promptError) {
        results.push({
          success: false,
          promptIndex: i,
          error: promptError.message
        });
      }
      
      // Add a small delay between requests to avoid rate limiting
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      error: 'Failed to process batch of prompts',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
    stack: err.stack
  });
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
  console.log(`Test the server at: http://localhost:${port}/test`);
}); 
