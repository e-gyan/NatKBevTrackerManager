
import React, { useState, useEffect } from 'react';
import { AppData, Settings, AIChat } from '../types';
import { chatWithBusinessCoach } from '../services/gemini';
import { Sparkles, Loader2, Key, Send, User, Bot, MessageSquare } from 'lucide-react';

interface InsightsProps {
  data: AppData;
  settings: Settings;
  onUpdate: (data: AppData) => void;
}

const Insights: React.FC<InsightsProps> = ({ data, settings, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  // Only auto-scroll to bottom of chat
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.aiChats]);

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
      <div className="text-center space-y-2 mb-4 shrink-0">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-full shadow-lg text-white mb-2">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Business Strategy Advisor</h2>
        <p className="text-sm text-slate-500">Your AI Product Manager for the Ghanaian Market.</p>
      </div>

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
      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
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
    </div>
  );
};

export default Insights;
