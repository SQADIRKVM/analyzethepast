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

// Increase JSON and URL-encoded body size limits for larger file uploads
app.use(express.json({ limit: '50mb' }));  // Increased limit for larger uploads
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

    let data;
    try {
      const textResponse = await response.text();
      console.log('Raw API Response:', textResponse);
      data = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return res.status(500).json({
        error: 'Invalid JSON response from API',
        raw_response: await response.text()
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

// Enhanced batch processing endpoint for multiple files
app.post('/api/batch', async (req, res) => {
  try {
    console.log('Received batch processing request');
    console.log('Files received:', req.files ? Object.keys(req.files).length : 0);
    console.log('Form data:', req.body);

    // In a production implementation, this would:
    // 1. Process each file in parallel or sequentially
    // 2. Combine the results
    // 3. Return the aggregated data
    
    // For now, just return acknowledgment
    res.json({ 
      message: 'Batch processing request received',
      received_files: req.body.fileCount || 0,
      type: req.body.type || 'unknown',
      status: 'pending'
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      error: 'Failed to process batch request',
      details: error.message,
      stack: error.stack
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
  console.log(`File size limit: ${app.get('json limit') || '50mb'}`);
});
