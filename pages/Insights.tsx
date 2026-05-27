
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Settings, AIChat } from '../types';
import { chatWithBusinessCoach } from '../services/gemini';
import { Sparkles, Loader2, Key, Send, User, Bot, MessageSquare, TrendingUp, CalendarDays, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

interface InsightsProps {
  data: AppData;
  settings: Settings;
  onUpdate: (data: AppData) => void;
}

const Insights: React.FC<InsightsProps> = ({ data, settings, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'TRENDS' | 'ADVISOR'>('TRENDS');
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('7D');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  // Only auto-scroll to bottom of chat
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.aiChats, activeTab]);

  const chartData = useMemo(() => {
     const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
     const now = new Date();
     const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);

     const dataMap: Record<string, { date: string, displayDate: string, grossProfit: number, expenses: number, netProfit: number }> = {};
     
     for (let i = 0; i < days; i++) {
         const d = new Date(startDate);
         d.setDate(d.getDate() + i);
         const dateStr = d.toLocaleDateString();
         const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
         dataMap[dateStr] = { date: dateStr, displayDate, grossProfit: 0, expenses: 0, netProfit: 0 };
     }

     (data.transactions || []).forEach(tx => {
         if (tx.type === 'SALE') {
             const d = new Date(tx.date).toLocaleDateString();
             if (dataMap[d]) {
                  dataMap[d].grossProfit += tx.profit || 0;
             }
         }
     });

     (data.expenses || []).forEach(exp => {
          const d = new Date(exp.date).toLocaleDateString();
          if (dataMap[d]) {
              dataMap[d].expenses += exp.amount || 0;
          }
     });

     return Object.values(dataMap).map(day => ({
         ...day,
         netProfit: day.grossProfit - day.expenses
     }));
  }, [data.transactions, data.expenses, timeRange]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    let key = process.env.API_KEY || apiKeyInput;
    if (!key) {
      setShowKeyInput(true);
      return;
    }

    setLoading(true);
    const answer = await chatWithBusinessCoach(question, data, key);
    
    const newChat: AIChat = {
        id: crypto.randomUUID(),
        question: question,
        answer: answer,
        timestamp: new Date().toISOString(),
        category: 'General'
    };

    onUpdate({
        ...data,
        aiChats: [...(data.aiChats || []), newChat]
    });

    setQuestion('');
    setLoading(false);
    setShowKeyInput(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="text-center space-y-2 mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800">Business Insights</h2>
        <p className="text-sm text-slate-500">Analytics and AI-driven recommendations.</p>
        
        <div className="flex justify-center mt-4">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
                <button 
                  onClick={() => setActiveTab('TRENDS')}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'TRENDS' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingUp size={16} /> Trends
                </button>
                <button 
                  onClick={() => setActiveTab('ADVISOR')}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'ADVISOR' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Sparkles size={16} /> AI Advisor
                </button>
            </div>
        </div>
      </div>

      {activeTab === 'TRENDS' && (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <LineChartIcon size={20} className="text-purple-600"/> Daily Net Profit
                      </h3>
                      <p className="text-sm text-slate-500">Gross Profit minus Expenses</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                      {(['7D', '30D', '90D'] as const).map(range => (
                          <button
                              key={range}
                              onClick={() => setTimeRange(range)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${timeRange === range ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              {range}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                              dataKey="displayDate" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: '#64748b' }} 
                              dy={10} 
                          />
                          <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 12, fill: '#64748b' }}
                              tickFormatter={(value) => `${settings.currency}${value}`}
                          />
                          <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: number) => [`${settings.currency}${value.toFixed(2)}`, 'Net Profit']}
                              labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                          />
                          <Area 
                              type="monotone" 
                              dataKey="netProfit" 
                              stroke="#8b5cf6" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorNet)" 
                          />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      {activeTab === 'ADVISOR' && (
      <>
      {showKeyInput && !process.env.API_KEY && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-4 shrink-0">
           <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><Key size={16}/> API Key Required</h4>
           <p className="text-sm text-yellow-700 mb-2">Please enter a Google Gemini API Key to use this feature.</p>
           <div className="flex gap-2">
             <input 
               type="password" 
               placeholder="Enter API Key" 
               className="flex-1 p-2 border border-yellow-300 rounded"
               value={apiKeyInput}
               onChange={(e) => setApiKeyInput(e.target.value)}
             />
             <button onClick={handleAsk} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">Confirm</button>
           </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col animate-fade-in">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
              {(!data.aiChats || data.aiChats.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                      <MessageSquare size={48} className="mb-4"/>
                      <p>Ask me anything about pricing, bundles, or marketing trends in Ghana.</p>
                  </div>
              )}

              {(data.aiChats || []).map(chat => (
                  <div key={chat.id} className="space-y-4">
                      {/* User Bubble */}
                      <div className="flex justify-end">
                          <div className="bg-slate-800 text-white max-w-[80%] rounded-2xl rounded-tr-none p-4 shadow-sm relative">
                               <p>{chat.question}</p>
                               <div className="absolute -top-6 right-0 text-xs text-slate-400 flex items-center gap-1">
                                   <User size={12}/> You • {new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </div>
                          </div>
                      </div>

                      {/* AI Bubble */}
                      <div className="flex justify-start">
                          <div className="bg-white border border-purple-100 text-slate-800 max-w-[90%] rounded-2xl rounded-tl-none p-6 shadow-sm relative">
                               <div className="prose prose-sm prose-purple max-w-none">
                                  {chat.answer.split('\n').map((line, i) => (
                                      <p key={i} className={`mb-2 ${line.includes('Warning') ? 'text-red-600 font-bold bg-red-50 p-2 rounded' : ''} ${line.trim().startsWith('-') ? 'ml-4' : ''}`}>
                                      {line}
                                      </p>
                                  ))}
                               </div>
                               <div className="absolute -top-6 left-0 text-xs text-purple-600 flex items-center gap-1 font-bold">
                                   <Bot size={12}/> Advisor
                               </div>
                          </div>
                      </div>
                  </div>
              ))}
              <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2 relative">
                  <input 
                    type="text" 
                    className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    placeholder="e.g. Suggest a Christmas bundle for corporate gifts..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleAsk()}
                    disabled={loading}
                  />
                  <button 
                    onClick={handleAsk}
                    disabled={loading || !question.trim()}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center transition-all ${loading ? 'bg-slate-200 text-slate-400' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-600/30'}`}
                  >
                      {loading ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
                  </button>
              </div>
          </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Insights;
