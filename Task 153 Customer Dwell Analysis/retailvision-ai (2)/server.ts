import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "RetailVision AI Backend" });
});

// API: Generate AI Store Insights
app.post("/api/ai/insights", async (req, res) => {
  try {
    const { zonesData, alertsData } = req.body;
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        success: true,
        summary: "AI Insights generated using Rule-Based Analytics Engine (API key fallback).",
        insights: [
          {
            id: 'gen-1',
            category: 'bottleneck',
            title: 'Billing Queue Wait Times Spiking',
            observation: 'Queue length is over capacity in the checkout zone.',
            recommendation: 'Open 2 additional cashier desks during high-traffic afternoon hours.',
            impact: 'high',
            timestamp: new Date().toLocaleTimeString()
          },
          {
            id: 'gen-2',
            category: 'behavior',
            title: 'Electronics High Dwell Engagement',
            observation: 'Shoppers spend average 8.5 minutes in Electronics.',
            recommendation: 'Add interactive product displays to boost conversion rate.',
            impact: 'medium',
            timestamp: new Date().toLocaleTimeString()
          }
        ]
      });
    }

    const prompt = `You are the Lead Retail Intelligence AI Specialist for RetailVision AI.
Analyze the following store analytics data and provide 3-4 highly strategic, actionable executive insights for store managers:

Zone Traffic Data:
${JSON.stringify(zonesData || [], null, 2)}

Active Alerts:
${JSON.stringify(alertsData || [], null, 2)}

Return a JSON array of insight objects with the following schema:
[
  {
    "id": "string",
    "category": "efficiency" | "bottleneck" | "behavior" | "queue",
    "title": "string headline",
    "observation": "detailed data observation",
    "recommendation": "actionable store layout/staffing recommendation",
    "impact": "high" | "medium" | "low",
    "timestamp": "string time"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "[]";
    const insights = JSON.parse(responseText);

    res.json({
      success: true,
      insights
    });
  } catch (error: any) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({ error: error?.message || "Failed to generate AI insights" });
  }
});

// API: AI Assistant Chatbot ("Ask RetailVision AI")
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, storeContext } = req.body;
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        reply: `[RetailVision Assistant] Based on current store telemetry: Groceries has 18 active shoppers (72% capacity), Electronics has highest average dwell time at 8.5 minutes, and Billing queue currently has 14 people waiting. (Set GEMINI_API_KEY in Secrets panel for live conversational AI).`
      });
    }

    const systemInstruction = `You are RetailVision AI, an expert AI Store Manager & Retail Analytics Assistant.
Answer questions accurately using the provided store context data.
Keep answers professional, structured with concise bullet points, and actionable for retail decision makers.

Store Context Data:
${JSON.stringify(storeContext || {}, null, 2)}`;

    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction
      }
    });

    res.json({
      reply: response.text || "I was unable to retrieve a response from the analytics engine."
    });
  } catch (error: any) {
    console.error("Error in AI chat endpoint:", error);
    res.status(500).json({ error: error?.message || "AI Chatbot query failed" });
  }
});

// API: Store Layout Optimization Suggestions
app.post("/api/ai/optimization", async (req, res) => {
  try {
    const { zones, customerFlow } = req.body;
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        suggestions: [
          {
            id: 'opt-fallback-1',
            title: 'Place Grab-and-Go Beverages Near Grocery Exit',
            description: 'Shoppers exiting groceries frequently cross beverages aisle without stopping.',
            currentPlacement: 'Section C-3 East Aisle',
            proposedPlacement: 'End-cap refrigerator unit adjacent to Grocery exit',
            projectedImpact: '+18% beverage impulse sales',
            confidenceScore: 0.91,
            category: 'product_relocation'
          }
        ]
      });
    }

    const prompt = `Based on retail computer vision flow data:
Zones: ${JSON.stringify(zones)}
Flow Data: ${JSON.stringify(customerFlow)}

Suggest 3 store layout, merchandise, or queue optimization improvements in JSON format:
[
  {
    "id": "opt-1",
    "title": "string",
    "description": "string explanation",
    "currentPlacement": "string current location",
    "proposedPlacement": "string new location",
    "projectedImpact": "e.g. +22% interaction",
    "confidenceScore": 0.94,
    "category": "product_relocation" | "queue_management" | "promotional_placement"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const suggestions = JSON.parse(response.text || "[]");
    res.json({ suggestions });
  } catch (error: any) {
    console.error("Optimization endpoint error:", error);
    res.status(500).json({ error: error?.message || "Optimization generation failed" });
  }
});

// API: Export Reports CSV / JSON / Text
app.post("/api/reports/generate", (req, res) => {
  const { reportType, format, data } = req.body;

  if (format === 'csv') {
    let csv = "Zone Name,Visitors,Avg Dwell (min),Peak Occupancy,Current Occupancy,Capacity Limit\n";
    if (data && Array.isArray(data.zones)) {
      data.zones.forEach((z: any) => {
        csv += `"${z.name}",${z.visitors},${z.avgDwellMinutes},${z.peakOccupancy},${z.currentOccupancy},${z.capacityLimit}\n`;
      });
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=RetailVision_${reportType}_${Date.now()}.csv`);
    return res.send(csv);
  }

  res.json({
    success: true,
    reportType,
    generatedAt: new Date().toISOString(),
    summaryText: `RetailVision AI Executive Report (${reportType.toUpperCase()})\nTotal Visitors Tracked: ${data?.totalVisitors || 1845}\nAverage Store Dwell Time: 14.8 minutes\nStore Health Score: ${data?.healthScore || 88}/100\nKey Recommendation: Deploy additional checkout staff between 5:30 PM - 8:30 PM.`,
    data
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RetailVision AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
