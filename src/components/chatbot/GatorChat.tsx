'use client';

import { useState, useRef, useEffect } from 'react';
import { findResponse, BIGBULL_CONFIG, type ChatMessage } from '@/lib/chatbot/knowledge';

// Horizontal alligator SVG for the bubble button
function BigBullIcon({ size = 'large' }: { size?: 'large' | 'small' }) {
  const w = size === 'large' ? 'w-12 h-8' : 'w-8 h-6';
  return (
    <svg viewBox="0 0 96 48" className={w} fill="none">
      {/* Tail */}
      <path d="M4 28 Q8 20 14 24 Q10 30 14 32" fill="#16a34a" />
      <path d="M4 28 Q8 34 14 32" fill="#22c55e" />
      {/* Body */}
      <ellipse cx="32" cy="28" rx="20" ry="12" fill="#22c55e" />
      {/* Scales/bumps on back */}
      <circle cx="22" cy="18" r="2.5" fill="#16a34a" />
      <circle cx="28" cy="16.5" r="2.5" fill="#16a34a" />
      <circle cx="34" cy="16" r="2.5" fill="#16a34a" />
      <circle cx="40" cy="17" r="2" fill="#16a34a" />
      {/* Belly */}
      <ellipse cx="32" cy="32" rx="16" ry="6" fill="#4ade80" opacity="0.4" />
      {/* Legs */}
      <path d="M20 36 L17 42 L20 41 L22 43 L23 38" fill="#16a34a" />
      <path d="M40 36 L37 42 L40 41 L42 43 L43 38" fill="#16a34a" />
      {/* Head - long snout */}
      <ellipse cx="56" cy="26" rx="12" ry="9" fill="#16a34a" />
      <ellipse cx="64" cy="24" rx="14" ry="6" fill="#22c55e" />
      {/* Upper jaw */}
      <path d="M62 20 Q72 18 80 22 Q76 24 62 24 Z" fill="#16a34a" />
      {/* Lower jaw */}
      <path d="M62 26 Q72 28 78 26 Q74 24 62 24 Z" fill="#22c55e" />
      {/* Teeth */}
      <path d="M68 22 L69 24.5 L70 22" fill="white" />
      <path d="M73 21 L74 23.5 L75 21" fill="white" />
      <path d="M69 26 L70 24 L71 26" fill="white" />
      {/* Mouth line */}
      <path d="M56 24 Q68 25 80 24" stroke="#15803d" strokeWidth="1" fill="none" />
      {/* Eye bumps */}
      <ellipse cx="54" cy="18" rx="4" ry="4.5" fill="#16a34a" />
      {/* Eyes */}
      <circle cx="54" cy="17" r="3" fill="white" />
      <circle cx="54" cy="17" r="1.5" fill="#0a0f1a" />
      {/* Nostril */}
      <circle cx="77" cy="21" r="1" fill="#15803d" />
    </svg>
  );
}

export default function GatorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bigbull',
      content: BIGBULL_CONFIG.greeting,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const response = findResponse(input);
    const bigBullMessage: ChatMessage = {
      role: 'bigbull',
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, bigBullMessage]);
    setInput('');
  };

  return (
    <>
      {/* Chat bubble button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 flex items-center gap-2 px-4 py-3 hover:scale-105 transition-transform gator-bubble"
          title="Chat with Big Bull"
        >
          <BigBullIcon size="large" />
          <span className="text-white text-xs font-bold">Big Bull</span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-[#111827] border border-[#1e293b] rounded-2xl shadow-2xl flex flex-col fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1e293b]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <BigBullIcon size="small" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Big Bull</h3>
                <p className="text-green-400 text-xs">Your Investment Buddy</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-[#1e293b] text-gray-200 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#1e293b]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Big Bull anything about investing..."
                className="flex-1 bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 text-white rounded-xl p-2.5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
