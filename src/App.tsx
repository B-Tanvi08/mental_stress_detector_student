import React, { useState, useEffect, useRef } from "react";
import { 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Heart, 
  Phone, 
  Mail, 
  ChevronRight,
  Moon,
  Utensils,
  BookOpen,
  DollarSign,
  Users,
  Info,
  MessageCircle,
  X,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  LayoutDashboard,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PredictionResult {
  prediction: string;
  stressScore: number;
  riskLevel: string;
  wellnessPlan: { id: string; task: string; category: string }[];
}

interface HistoryItem {
  date: string;
  score: number;
  prediction: string;
  isPredicted?: boolean;
}

interface HistoryResponse {
  history: HistoryItem[];
  trend: string;
  insight: string;
}

const QUOTES = [
  "This is just a moment, not your whole story.",
  "You are stronger than you think.",
  "Small steps still move you forward.",
  "It’s okay to take a pause.",
  "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.",
  "You don't have to see the whole staircase, just take the first step."
];

export default function App() {
  const [view, setView] = useState<"landing" | "form" | "result" | "dashboard">("landing");
  const [formData, setFormData] = useState({
    academicPressure: 3,
    studySatisfaction: 3,
    sleepDuration: 7,
    dietaryHabits: "Moderate",
    financialStress: 3,
    familyHistory: "No",
  });

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [futureData, setFutureData] = useState<HistoryItem[]>([]);
  const [wellnessTasks, setWellnessTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    {role: 'bot', text: "Hello! I'm your mental support assistant. How are you feeling today?"}
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      setHistory(data);

      // Fetch Future Prediction
      const futureRes = await fetch("/api/predict-future");
      const futureData = await futureRes.json();
      if (futureData.futureData) {
        setFutureData(futureData.futureData);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setResult(data);
      setView("result");
      fetchHistory();
    } catch (error) {
      console.error("Prediction failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMsg = currentMessage;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setCurrentMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch (error) {
      console.error("Chat failed:", error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High": return "text-rose-600 bg-rose-50 border-rose-200";
      case "Medium": return "text-amber-600 bg-amber-50 border-amber-200";
      default: return "text-emerald-600 bg-emerald-50 border-emerald-200";
    }
  };

  const getProgressColor = (score: number) => {
    if (score > 70) return "bg-rose-500";
    if (score > 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Improving": return <TrendingDown className="text-emerald-500" />;
      case "Worsening": return <TrendingUp className="text-rose-500" />;
      default: return <Minus className="text-slate-400" />;
    }
  };

  const toggleWellnessTask = (id: string) => {
    setWellnessTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const combinedChartData = history ? [
    ...[...history.history].reverse(),
    ...futureData
  ] : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setView("landing")}
          >
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <Brain className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Stress Detector
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => { setView("dashboard"); fetchHistory(); }}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full text-sm font-medium transition-all"
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <a 
              href="tel:18005990019" 
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-sm font-medium hover:bg-rose-100 transition-colors border border-rose-100"
            >
              <Phone size={16} />
              <span className="hidden sm:inline">Call for Help</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8"
            >
              <div className="space-y-4 max-w-2xl">
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
                >
                  Your Mental Well-being <br />
                  <span className="text-indigo-600">Matters Most.</span>
                </motion.h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                  A safe space to check your stress levels, track your progress, and get personalized support.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                <button 
                  onClick={() => setView("form")}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1"
                >
                  Start Assessment
                </button>
                <button 
                  onClick={() => { setView("dashboard"); fetchHistory(); }}
                  className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all"
                >
                  View Progress
                </button>
              </div>

              <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {QUOTES.slice(0, 3).map((quote, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm italic text-slate-600"
                  >
                    "{quote}"
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === "form" && (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl">
                      <Activity className="text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Assessment</h2>
                  </div>
                  <button 
                    onClick={() => setView("landing")}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Academic Pressure */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <BookOpen size={18} className="text-indigo-500" /> Academic Pressure (1-5)
                      </label>
                      <input 
                        type="range" min="1" max="5" step="1"
                        value={formData.academicPressure}
                        onChange={(e) => setFormData({...formData, academicPressure: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>

                    {/* Study Satisfaction */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Activity size={18} className="text-indigo-500" /> Study Satisfaction (1-5)
                      </label>
                      <input 
                        type="range" min="1" max="5" step="1"
                        value={formData.studySatisfaction}
                        onChange={(e) => setFormData({...formData, studySatisfaction: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>

                    {/* Sleep Duration */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Moon size={18} className="text-indigo-500" /> Sleep Duration (Hours)
                      </label>
                      <input 
                        type="number" min="0" max="24"
                        value={formData.sleepDuration}
                        onChange={(e) => setFormData({...formData, sleepDuration: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-slate-50/50"
                      />
                    </div>

                    {/* Financial Stress */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <DollarSign size={18} className="text-indigo-500" /> Financial Stress (1-5)
                      </label>
                      <input 
                        type="range" min="1" max="5" step="1"
                        value={formData.financialStress}
                        onChange={(e) => setFormData({...formData, financialStress: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs font-medium text-slate-400">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Dietary Habits */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Utensils size={18} className="text-indigo-500" /> Dietary Habits
                      </label>
                      <select 
                        value={formData.dietaryHabits}
                        onChange={(e) => setFormData({...formData, dietaryHabits: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-slate-50/50"
                      >
                        <option value="Healthy">Healthy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Unhealthy">Unhealthy</option>
                      </select>
                    </div>

                    {/* Family History */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Users size={18} className="text-indigo-500" /> Family History
                      </label>
                      <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                        {['Yes', 'No'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setFormData({...formData, familyHistory: option})}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                              formData.familyHistory === option 
                                ? "bg-white text-indigo-600 shadow-sm" 
                                : "text-slate-500 hover:text-slate-700"
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-1 active:translate-y-0"
                  >
                    {loading ? "Analyzing..." : "Get Results"}
                    {!loading && <ChevronRight size={20} />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === "result" && result && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setView("form")}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                  <ArrowLeft size={20} /> Back to Form
                </button>
                <h2 className="text-2xl font-bold text-slate-800">Your Analysis</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stress Score Card */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Stress Score</p>
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64" cy="64" r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100"
                      />
                      <motion.circle
                        cx="64" cy="64" r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        initial={{ strokeDashoffset: 364.4 }}
                        animate={{ strokeDashoffset: 364.4 - (364.4 * result.stressScore) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={cn("transition-colors duration-500", 
                          result.stressScore > 70 ? "text-rose-500" : 
                          result.stressScore > 40 ? "text-amber-500" : "text-emerald-500"
                        )}
                      />
                    </svg>
                    <span className="absolute text-3xl font-black text-slate-800">{result.stressScore}</span>
                  </div>
                  <p className="text-slate-500 text-sm">Out of 100</p>
                </div>

                {/* Risk Level Card */}
                <div className={cn("p-8 rounded-3xl border flex flex-col items-center justify-center text-center space-y-4", getRiskColor(result.riskLevel))}>
                  <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Risk Level</p>
                  <div className="bg-white/50 p-4 rounded-full">
                    <AlertTriangle size={40} />
                  </div>
                  <h3 className="text-4xl font-black">{result.riskLevel}</h3>
                  <p className="text-sm opacity-80">Categorized based on your responses.</p>
                </div>

                {/* Prediction Card */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Prediction</p>
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black", 
                    result.prediction === 'Yes' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {result.prediction}
                  </div>
                  <p className="text-slate-500 text-sm">Depression Likelihood</p>
                </div>
              </div>

              {/* Wellness Plan Checklist */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl">
                      <CheckCircle2 className="text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Your Wellness Plan</h3>
                  </div>
                  <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {wellnessTasks.length} / {result.wellnessPlan.length} Done
                  </div>
                </div>
                <div className="space-y-3">
                  {result.wellnessPlan.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => toggleWellnessTask(item.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all",
                        wellnessTasks.includes(item.id) 
                          ? "bg-emerald-50 border-emerald-100 opacity-60" 
                          : "bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        wellnessTasks.includes(item.id)
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 bg-white"
                      )}>
                        {wellnessTasks.includes(item.id) && <CheckCircle2 size={14} />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("font-bold text-sm", wellnessTasks.includes(item.id) ? "text-emerald-700 line-through" : "text-slate-700")}>
                          {item.task}
                        </p>
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={() => { setView("dashboard"); fetchHistory(); }}
                  className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  <LayoutDashboard size={20} />
                  Go to Progress Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {view === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900">Progress Dashboard</h2>
                <button 
                  onClick={() => setView("landing")}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              {!history || history.history.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <History className="text-slate-300" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-600">No History Yet</h3>
                  <p className="text-slate-400 max-w-xs mx-auto">Take your first assessment to start tracking your mental well-being over time.</p>
                  <button 
                    onClick={() => setView("form")}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    Start Assessment
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Trend Insight */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Trend</p>
                        {getTrendIcon(history.trend)}
                      </div>
                      <h3 className={cn("text-3xl font-black", 
                        history.trend === "Improving" ? "text-emerald-600" : 
                        history.trend === "Worsening" ? "text-rose-600" : "text-slate-600"
                      )}>
                        {history.trend}
                      </h3>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-sm text-slate-600 leading-relaxed italic">
                          "{history.insight}"
                        </p>
                      </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-3xl text-white space-y-4 shadow-xl shadow-indigo-200">
                      <h4 className="font-bold text-lg">Weekly Tip</h4>
                      <p className="text-indigo-100 text-sm leading-relaxed">
                        "Mindfulness isn't about clearing your mind, but about being present with whatever is in it."
                      </p>
                      <button className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-all">
                        Read More
                      </button>
                    </div>
                  </div>

                  {/* Graph */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-slate-800">Stress Score History</h3>
                      <div className="flex gap-4 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-indigo-500" /> Score
                        </div>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={combinedChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => new Date(str).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#94A3B8', fontSize: 12}}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#94A3B8', fontSize: 12}}
                          />
                          <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            labelFormatter={(str) => new Date(str).toLocaleString()}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#4F46E5" 
                            strokeWidth={4} 
                            dot={(props: any) => {
                              const { cx, cy, payload } = props;
                              if (payload.isPredicted) {
                                return <circle key={`dot-${payload.date}`} cx={cx} cy={cy} r={4} fill="#fff" stroke="#4F46E5" strokeWidth={2} />;
                              }
                              return <circle key={`dot-${payload.date}`} cx={cx} cy={cy} r={6} fill="#4F46E5" stroke="#fff" strokeWidth={2} />;
                            }}
                            strokeDasharray="5 5"
                            activeDot={{r: 8, strokeWidth: 0}}
                          />
                          {/* Historical Line (Solid) */}
                          <Line 
                            type="monotone" 
                            data={history ? [...history.history].reverse() : []}
                            dataKey="score" 
                            stroke="#4F46E5" 
                            strokeWidth={4} 
                            dot={{r: 6, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff'}}
                            activeDot={{r: 8, strokeWidth: 0}}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* History List */}
                  <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">Recent Attempts</h3>
                      <button className="text-indigo-600 text-sm font-bold hover:underline">Export Data</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Stress Score</th>
                            <th className="px-6 py-4">Prediction</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {history.history.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {new Date(item.date).toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", getProgressColor(item.score))} />
                                  <span className="font-bold text-slate-800">{item.score}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold", 
                                  item.prediction === 'Yes' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                )}>
                                  {item.prediction === 'Yes' ? 'Depressed' : 'Normal'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                  <ChevronRight size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-white w-[350px] sm:w-[400px] h-[500px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-4"
            >
              {/* Chat Header */}
              <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Support Assistant</h4>
                    <p className="text-[10px] opacity-80">Always here to help</p>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white ml-auto rounded-tr-none" 
                        : "bg-white text-slate-700 shadow-sm rounded-tl-none border border-slate-100"
                    )}
                  >
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input 
                  type="text" 
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            "w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95",
            chatOpen ? "bg-slate-800 text-white rotate-90" : "bg-indigo-600 text-white"
          )}
        >
          {chatOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Brain className="text-white w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800">Stress Detector</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Empowering students to take control of their mental well-being through data-driven insights and empathetic support.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800">Support Resources</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Counseling Services</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Meditation Guides</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Academic Support</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Crisis Helplines</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800">Contact</h4>
            <div className="flex flex-col gap-3">
              <a 
                href="mailto:support@wellness.edu" 
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Mail size={16} /> support@wellness.edu
              </a>
              <button className="w-fit px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                Email Counsellor
              </button>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:row justify-between items-center gap-4 text-slate-400 text-xs">
          <p>© 2026 Student Mental Stress Detector. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
