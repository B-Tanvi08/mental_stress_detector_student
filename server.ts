import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
if (!fs.existsSync("database")) fs.mkdirSync("database");
if (!fs.existsSync("models")) fs.mkdirSync("models");

// Fallback JSON store (for AI Studio preview stability)
const DB_FILE = "database/history.json";
const getHistory = () => {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return [];
  }
};
const saveHistory = async (item: any) => {
  const history = getHistory();
  history.push({ ...item, id: Date.now() });
  fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint: /api/predict
  app.post("/api/predict", (req, res) => {
    const {
      userId = "default_user",
      userName = "Guest",
      academicPressure,
      studySatisfaction,
      sleepDuration,
      dietaryHabits,
      financialStress,
      familyHistory,
    } = req.body;

    // 1. Current Stress Calculation (Heuristic)
    let stressScore = (academicPressure * 15) + ((5 - studySatisfaction) * 15) + (financialStress * 10);
    if (sleepDuration < 6) stressScore += 20;
    stressScore = Math.min(Math.max(stressScore, 0), 100);

    const prediction = stressScore > 65 ? "Yes" : "No";
    const riskLevel = stressScore > 70 ? "High" : stressScore > 40 ? "Medium" : "Low";

    // 2. Generate Structured Wellness Plan
    const wellnessPlan = [];
    if (sleepDuration < 7) {
      wellnessPlan.push({ id: 'sleep', task: "Establish a 10 PM wind-down routine (no screens)", category: "Sleep" });
    }
    if (academicPressure > 3) {
      wellnessPlan.push({ id: 'study', task: "Use Pomodoro: 25m study / 5m break for next 3 days", category: "Academic" });
    }
    if (financialStress > 3) {
      wellnessPlan.push({ id: 'finance', task: "Review weekly budget and identify 2 non-essential costs to cut", category: "Financial" });
    }
    if (stressScore > 50) {
      wellnessPlan.push({ id: 'mind', task: "Complete one 10-minute guided meditation daily", category: "Mindfulness" });
    }
    wellnessPlan.push({ id: 'social', task: "Call or meet a friend for 30 minutes this weekend", category: "Social" });

    // 3. Save to DB
    saveHistory({
      userId, userName, date: new Date().toISOString(), academicPressure, 
      studySatisfaction, sleepDuration, dietaryHabits, financialStress, 
      familyHistory, stressScore, prediction
    });

    res.json({
      prediction,
      stressScore,
      riskLevel,
      wellnessPlan
    });
  });

  // API Endpoint: /api/predict-future (Time Series Analysis)
  app.get("/api/predict-future", (req, res) => {
    const userId = req.query.userId || "default_user";
    const allHistory = getHistory();
    const userHistory = allHistory
      .filter((h: any) => h.userId === userId)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (userHistory.length < 3) {
      return res.json({ 
        error: "Need at least 3 assessments to predict future trends.",
        futureData: [] 
      });
    }

    // Algorithm: Simple Linear Regression (y = mx + b)
    // x = index of attempt, y = stress score
    const n = userHistory.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    userHistory.forEach((h: any, i: number) => {
      sumX += i;
      sumY += h.stressScore;
      sumXY += i * h.stressScore;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next 3 points
    const futureData = [];
    const lastDate = new Date(userHistory[n-1].date);
    
    for (let i = 1; i <= 3; i++) {
      const predictedScore = Math.min(Math.max(slope * (n + i - 1) + intercept, 0), 100);
      const futureDate = new Date(lastDate);
      futureDate.setDate(lastDate.getDate() + i);
      
      futureData.push({
        date: futureDate.toISOString(),
        score: Math.round(predictedScore),
        isPredicted: true
      });
    }

    res.json({ futureData });
  });

  // API Endpoint: /api/history
  app.get("/api/history", (req, res) => {
    const userId = req.query.userId || "default_user";
    const allHistory = getHistory();
    const rows = allHistory
      .filter((h: any) => h.userId === userId)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((h: any) => ({ date: h.date, score: h.stressScore, prediction: h.prediction }));
    
    let trend = "Stable";
    let insight = "Keep monitoring your well-being.";
    if (rows.length >= 2) {
      const latest = rows[0].score;
      const previous = rows[1].score;
      if (latest < previous - 5) {
        trend = "Improving";
        insight = "You are improving over time. Great job on taking care of yourself!";
      } else if (latest > previous + 5) {
        trend = "Worsening";
        insight = "Stress levels are increasing. Consider taking some time for self-care or talking to someone.";
      }
    }

    res.json({ history: rows, trend, insight });
  });

  // API Endpoint: /api/chat (Simplified Rule-based NLP for easy explanation)
  app.post("/api/chat", (req, res) => {
    const { message } = req.body;
    
    // 1. Basic Tokenization (Splitting into words)
    const tokens = message.toLowerCase().split(/\W+/);
    
    // 2. Keyword Matching (Simplified NLP logic)
    let response = "I'm here to listen. Could you tell me more about that?";
    
    const slogans = [
      "Every cloud has a silver lining.",
      "This too shall pass.",
      "You are stronger than you think.",
      "Small steps still move you forward.",
      "It's okay to take a pause."
    ];

    const rules = [
      { 
        keywords: ["sad", "unhappy", "depressed", "low", "lonely"], 
        get response() {
          const slogan = slogans[Math.floor(Math.random() * slogans.length)];
          return `I'm sorry you're feeling this way. Remember: '${slogan}' To feel better, try: 1. Taking deep breaths, 2. Going for a short walk, 3. Eating a nourishing meal, or 4. Calling a close friend. If things feel too heavy, please reach out to a professional.`;
        }
      },
      { 
        keywords: ["happy", "good", "great", "excellent", "wonderful", "joy"], 
        response: "That's wonderful to hear! To keep this positive energy going: 1. Practice gratitude by writing down three things you're thankful for, 2. Share your joy with someone else, or 3. Treat yourself to something you love. Keep shining!" 
      },
      { 
        keywords: ["stress", "pressure", "overwhelmed", "exams", "anxious"], 
        response: "It sounds like you're under a lot of pressure. 'One step at a time is enough.' Try: 1. Breaking your tasks into small pieces, 2. A 5-minute meditation, or 3. Stepping away from your screen for a bit. You've got this!" 
      },
      { 
        keywords: ["sleep", "tired", "insomnia"], 
        response: "Rest is crucial for your brain. Try to keep a consistent sleep schedule, avoid screens before bed, and maybe try some chamomile tea. Your body needs to recharge!" 
      },
      { 
        keywords: ["help", "emergency", "suicide", "hurt"], 
        response: "If you're in immediate distress, please call the emergency helpline at 1800-599-0019. You're not alone, and there are people who want to support you." 
      },
      { 
        keywords: ["hello", "hi", "hey"], 
        response: "Hello! I'm your mental wellness assistant. How are you feeling today?" 
      },
      { 
        keywords: ["thank", "thanks"], 
        response: "You're very welcome! I'm always here if you need a supportive word or some self-care tips." 
      }
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => tokens.includes(keyword))) {
        response = rule.response;
        break;
      }
    }
    
    res.json({ response });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
