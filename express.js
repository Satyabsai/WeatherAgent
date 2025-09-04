const express = require('express');
const axios = require('axios');
const app = express();

// Your Direct Line secret from Azure Bot Service
const DIRECT_LINE_SECRET = process.env.DIRECT_LINE_SECRET || 'YOUR_DIRECT_LINE_SECRET';

app.use(express.json());

// Generate Direct Line token endpoint
app.post('/api/directline/token', async (req, res) => {
  try {
    const response = await axios.post(
      'https://directline.botframework.com/v3/directline/tokens/generate',
      {},
      {
        headers: {
          'Authorization': `Bearer ${DIRECT_LINE_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      token: response.data.token,
      conversationId: response.data.conversationId || null,
      expires_in: response.data.expires_in || 3600
    });

  } catch (error) {
    console.error('Error generating Direct Line token:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate Direct Line token',
      message: error.message
    });
  }
});

// Start conversation endpoint (optional)
app.post('/api/directline/conversations', async (req, res) => {
  try {
    const response = await axios.post(
      'https://directline.botframework.com/v3/directline/conversations',
      {},
      {
        headers: {
          'Authorization': `Bearer ${DIRECT_LINE_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      conversationId: response.data.conversationId,
      token: response.data.token,
      streamUrl: response.data.streamUrl
    });

  } catch (error) {
    console.error('Error starting conversation:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to start conversation',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Direct Line proxy server running on port ${PORT}`);
});
