import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import { startServer } from "@microsoft/agents-hosting-express";
import { AgentApplication, MemoryStorage } from "@microsoft/agents-hosting";
import cors from "cors";
// // Create Express app
const app = express();

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

// Excel upload endpoint: expects a file with a 'City' column
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let results = [];
    for (let i = 0; i < rows.length; i++) {
      const city = rows[i].City;
      if (!city) {
        results.push({ row: i + 1, error: "Missing City column" });
        continue;
      }
      // Call agent for each city
      const responses = [];
      const context = {
        activity: { text: `weather in ${city}` },
        sendActivity: async (responseActivity) => {
          if (typeof responseActivity === "string") {
            responses.push(responseActivity);
          } else if (responseActivity && responseActivity.text) {
            responses.push(responseActivity.text);
          }
        }
      };
      const state = {
        getValue: (key) => context[key],
        setValue: (key, value) => { context[key] = value; }
      };
      await agent._handleMessage(context, state);
      results.push({ row: i + 1, city, responses });
      // Optionally: send progress
    }
    res.json({ total: rows.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// CORS setup
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Catch-all OPTIONS handler
app.options(/.*/, (req, res) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", corsOptions.methods.join(","));
  res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(","));
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

// Agent logic
class CustomAgent extends AgentApplication {
  constructor(storage) {
    super({ storage });
    this.onConversationUpdate("membersAdded", this._welcome);
    this.onMessage("/help", this._help);
    this.onActivity("message", this._handleMessage);
  }

  _welcome = async (context) => {
    await context.sendActivity("Welcome to Custom Agent. Type /help or send a message!");
  };

  _help = async (context) => {
    await context.sendActivity("Agent instructions: Type anything to interact.");
  };

  _handleMessage = async (context, state) => {
    const counter = state.getValue("conversation.counter") || 0;
    // Echo response
    await context.sendActivity(`[${counter}] Echo: ${context.activity.text}`);
    state.setValue("conversation.counter", counter + 1);

    // Weather logic
        await context.sendActivity("Agent. Weather Report CAll!");

    const text = context.activity.text;
    const match = text.match(/weather.*in\s+([a-zA-Z\s]+)/i);
    if (match) {
      const city = match[1].trim();
      try {
         await context.sendActivity("Agent.geting info..");
        const reply = await fetchWeather(city);
        await context.sendActivity(reply);
      } catch (err) {
        await context.sendActivity('Sorry, could not fetch weather information.');
      }
    }
  };
}

const agent = new CustomAgent(new MemoryStorage());


import axios from "axios";

// Weather API integration
const API_KEY = "7TU5LXT99DNXAFQYVKPETTHRW";
const fetchWeather = async (city) => {
  const endpoint = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=metric&key=${API_KEY}`;
  const res = await axios.get(endpoint);
  const today = res.data.days[0];
  return `Weather in ${city}: ${today.conditions}, Temp: ${today.temp}°C.`;
};

// /api/messages endpoint: parse city from user input and call weather API

app.post('/api/messages', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    // Collect all responses from agent
    const responses = [];
    const context = {
      activity: { text },
      sendActivity: async (responseActivity) => {
        // Accept both string and object
        if (typeof responseActivity === 'string') {
          responses.push(responseActivity);
        } else if (responseActivity && responseActivity.text) {
          responses.push(responseActivity.text);
        }
      }
    };
    const state = {
      getValue: (key) => context[key],
      setValue: (key, value) => { context[key] = value; }
    };
    await agent._handleMessage(context, state);
    res.json({ responses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
startServer(agent, { app });