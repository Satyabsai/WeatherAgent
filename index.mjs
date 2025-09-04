// index.mjs
import cors from 'cors';
import express from 'express'; // If using express explicitly
import { startServer } from '@microsoft/agents-hosting-express'
import { AgentApplication, MemoryStorage } from '@microsoft/agents-hosting'

class EchoAgent extends AgentApplication {
  constructor (storage) {
    super({ storage })
    const app = express();
    // Enable CORS for your React app
    app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3001'], // Your React app URLs
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    app.use(express.json());
    
    // Proxy endpoint to MS 365 Agent
    app.post('/api/messages', async (req, res) => {
      try {
        const { text, type, channelId } = req.body;
        
        // Forward to MS 365 Agent running on localhost:56150
        const response = await fetch('http://localhost:56150/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add any required authentication headers
          },
          body: JSON.stringify({
            type: type || 'message',
            text: text,
            from: {
              id: 'web-user',
              name: 'Web User'
            },
            channelId: channelId || 'webchat',
            conversation: {
              id: `web-${Date.now()}`
            },
            serviceUrl: 'http://localhost:56150/'
          })
        });
    
        if (!response.ok) {
          throw new Error(`MS 365 Agent responded with ${response.status}`);
        }
    
        const data = await response.json();
        
        // Return formatted response
        res.json({
          text: data.text || data.message || 'Response from MS 365 Agent',
          type: 'message',
          timestamp: new Date().toISOString()
        });
    
      } catch (error) {
        console.error('Error communicating with MS 365 Agent:', error);
        res.status(500).json({
          text: 'Sorry, I encountered an error processing your request.',
          error: error.message
        });
      }
    });
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
    app.listen
    
    // app.use(cors());

    // this.onConversationUpdate('membersAdded', this._help)
    // this.onMessage('/help', this._help)
    // this.onActivity('message', this._echo)
  }

  _help = async context => 
    await context.sendActivity(`Welcome to the Echo Agent sample 🚀. 
      Type /help for help or send a message to see the echo feature in action.`)

  _echo = async (context, state) => {
    let counter= state.getValue('conversation.counter') || 0
    await context.sendActivity(`[${counter++}]You said: ${context.activity.text}`)
    state.setValue('conversation.counter', counter)
  }
}

startServer(new EchoAgent(new MemoryStorage()))