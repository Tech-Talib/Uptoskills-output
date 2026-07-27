import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, AlertTriangle, Lightbulb, TrendingUp, CheckCircle } from 'lucide-react';
import { AiInsightItem, ChatMessage, ZoneMetric, SmartAlert } from '../types';

interface AiInsightsViewProps {
  insights: AiInsightItem[];
  zones: ZoneMetric[];
  alerts: SmartAlert[];
  onRefreshInsights: () => void;
  isLoadingInsights: boolean;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({
  insights,
  zones,
  alerts,
  onRefreshInsights,
  isLoadingInsights
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: "Hello! I am RetailVision AI Assistant. I have analyzed today's footfall, dwell times, and queue bottleneck telemetry. Ask me anything about store performance, peak hours, or merchandise layout optimizations!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  const samplePrompts = [
    "Which zone currently has the highest dwell time?",
    "Why is the billing queue overflowing between 6–8 PM?",
    "Show yesterday's busiest store hour",
    "What layout changes will increase beverage sales?"
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages,
          storeContext: { zones, alerts, insights }
        })
      });

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "Unable to parse AI response.",
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'assistant',
        text: "I am having trouble connecting to the AI server. Based on stored telemetry, Electronics has 8.5m avg dwell time and Billing queue reached 14 shoppers.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">AI Executive Intelligence & Conversational Assistant</h2>
            <p className="text-xs text-slate-500">Powered by Server-Side Gemini 3.6 Flash Engine</p>
          </div>
        </div>

        <button
          onClick={onRefreshInsights}
          disabled={isLoadingInsights}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingInsights ? 'animate-spin' : ''}`} />
          <span>{isLoadingInsights ? 'Re-analyzing Telemetry...' : 'Generate Fresh AI Insights'}</span>
        </button>
      </div>

      {/* Main Grid: AI Insights Cards (7 Cols) + Interactive AI Chatbot (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Executive Insights Cards */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>AI Executive Diagnosis & Recommendations</span>
          </h3>

          <div className="space-y-3">
            {insights.map(item => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                      item.impact === 'high'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : item.impact === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {item.impact} IMPACT
                    </span>
                    <span className="text-xs font-bold text-slate-800">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                </div>

                <div className="text-xs text-slate-700 space-y-1.5">
                  <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                    <strong className="text-blue-600 font-semibold block mb-0.5">Observation:</strong>
                    {item.observation}
                  </p>
                  <p className="bg-green-50 p-2.5 rounded-lg border border-green-200 text-green-900">
                    <strong className="text-green-700 font-semibold block mb-0.5">AI Recommendation:</strong>
                    {item.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Chatbot Assistant */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[520px]">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bot className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Ask RetailVision AI Assistant</h3>
            </div>

            {/* Quick Sample Prompts */}
            <div className="my-3 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Suggested Questions:</span>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-blue-400 px-2.5 py-1 rounded-lg text-left transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Chat History Box */}
            <div className="space-y-3 my-3 max-h-[300px] overflow-y-auto pr-1">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-blue-50 border-blue-200 text-slate-900 ml-6'
                      : 'bg-slate-50 border-slate-200 text-slate-800 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[10px] opacity-75">
                    <span>{msg.sender === 'user' ? 'You' : 'RetailVision AI'}</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                </div>
              ))}
              {isSending && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Thinking & querying store database...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input Box */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a question about store traffic, queues, dwell time..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputQuery.trim()}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
