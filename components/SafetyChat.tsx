import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, ShieldCheck } from 'lucide-react';
import { ChatMessage } from '../types';
import { getSafetyAdvice } from '../services/geminiService';

export const SafetyChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello. I am Women Safety AI. I can help with safety tips, first aid advice, or guide you if you feel unsafe. How can I assist?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await getSafetyAdvice(messages, input);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-md mx-auto">
      <div className="p-4 border-b border-gray-800 bg-guardian-card/50 backdrop-blur flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot size={20} className="text-white" />
        </div>
        <div>
            <h2 className="text-white font-bold">Women Safety Assistant</h2>
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-gray-400">Online</span>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-guardian-red text-white rounded-br-none'
                  : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl p-3 rounded-bl-none flex gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-guardian-dark border-t border-gray-800 mb-safe">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your safety concern..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-3 text-white focus:outline-none focus:border-guardian-red placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-guardian-red p-3 rounded-full text-white disabled:opacity-50 hover:bg-red-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-gray-500 text-center mt-2">
            AI advice can be incorrect. In emergencies, always call local authorities.
        </p>
      </div>
    </div>
  );
};