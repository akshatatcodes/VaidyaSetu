import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, Volume2, Sparkles, Activity, Heart, Shield } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const SUGGESTIONS = [
  { icon: Activity, text: 'Analyze my vitals', color: 'text-emerald-500' },
  { icon: Heart, text: 'Heart health tips', color: 'text-rose-500' },
  { icon: Shield, text: 'Preventive care advice', color: 'text-blue-500' },
];

// Typing indicator dots
const TypingDots = () => (
  <div className="flex items-center gap-1 py-1 px-1">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-emerald-400"
        style={{ animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
      />
    ))}
  </div>
);

const Chatbot = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! 🙏 I am **VaidyaSetu AI**, your personal health companion. I can help with symptom checking, health insights, and wellness guidance.\n\nHow can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const lastAiMessageRef = useRef(null);
  const lastUserMessageRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Custom smooth scroll with easing — slower and gentler than scrollIntoView
  const smoothScrollTo = (targetEl, duration = 700, topOffset = 16) => {
    const container = scrollContainerRef.current;
    if (!container || !targetEl) return;
    const containerTop = container.getBoundingClientRect().top;
    const targetTop = targetEl.getBoundingClientRect().top;
    const start = container.scrollTop;
    const distance = (targetTop - containerTop) - topOffset;
    const startTime = performance.now();

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollTop = start + distance * easeInOutCubic(progress);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLastUserMessage = () => {
    if (lastUserMessageRef.current) {
      smoothScrollTo(lastUserMessageRef.current, 700, 16);
    } else {
      scrollToBottom();
    }
  };

  const scrollToLastAiMessage = () => {
    if (lastAiMessageRef.current) {
      smoothScrollTo(lastAiMessageRef.current, 700, 12);
    } else {
      scrollToBottom();
    }
  };

  // Scroll after messages render — runs AFTER React attaches refs
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'user') {
      // Show user's message at top so they can read the exchange downward
      smoothScrollTo(lastUserMessageRef.current, 700, 12);
    } else if (lastMsg.role === 'assistant') {
      // Show start of AI response
      smoothScrollTo(lastAiMessageRef.current, 700, 12);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage) return;
    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    // scroll is handled by useEffect on messages

    try {
      const historyToSend = messages.length > 1 ? messages.slice(1) : [];
      const res = await axios.post(`${API_URL}/chat/symptom`, {
        clerkId: user?.id,
        message: userMessage,
        conversationHistory: historyToSend
      });

      if (res.data.status === 'success') {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        // scroll handled by useEffect
      }
    } catch (err) {
      const reply = err.response?.data?.reply || 'Sorry, I am having trouble connecting. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      // scroll handled by useEffect
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') alert('Microphone access denied.');
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Render message with basic markdown-like formatting
  const renderMessage = (content) => {
    return content.split('\n').map((line, i) => {
      // Bold: **text**
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-bold">{part}</strong> : part
          )}
          {i < content.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
        }
        .chat-pulse { animation: chatPulse 2.5s ease-in-out infinite; }
        .msg-in { animation: msgIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 chat-pulse ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full border-2 border-white animate-pulse" />
        </div>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[360px] sm:w-[420px] max-h-[88vh] flex flex-col rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.5)] transition-all duration-500 z-[200] origin-bottom-right overflow-hidden border border-white/10 backdrop-blur-2xl ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(145deg, rgba(3,7,18,0.98) 0%, rgba(6,18,29,0.98) 100%)' }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/5 pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-gray-950 animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm tracking-tight">VaidyaSetu AI</h3>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Health Intelligence Engine</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="relative z-10 p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.map((msg, idx) => {
            const isLastAiMsg = msg.role === 'assistant' && idx === messages.length - 1;
            const isLastUserMsg = msg.role === 'user' && (
              // last user message = highest index user message
              !messages.slice(idx + 1).some(m => m.role === 'user')
            );
            return (
            <div
              key={idx}
              ref={isLastAiMsg ? lastAiMessageRef : isLastUserMsg ? lastUserMessageRef : null}
              className={`flex gap-3 msg-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-white" />
                  : <Bot className="w-4 h-4 text-white" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${msg.role === 'user'
                ? 'bg-gradient-to-br from-blue-600/90 to-indigo-700/90 text-white rounded-tr-sm border border-blue-500/30'
                : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/10 backdrop-blur-sm'
              }`}>
                {renderMessage(msg.content)}
              </div>
            </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 msg-in">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 backdrop-blur-sm">
                <TypingDots />
              </div>
            </div>
          )}

          {/* Suggestion chips — shown only at start */}
          {showSuggestions && messages.length === 1 && !loading && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1">Quick questions</p>
              {SUGGESTIONS.map(({ icon: Icon, text, color }) => (
                <button
                  key={text}
                  onClick={() => handleSend(text)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 transition-all text-left group"
                >
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors font-medium">{text}</span>
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer */}
        <div className="px-5 py-2 bg-amber-500/5 border-t border-amber-500/10 text-[9px] text-amber-500/70 text-center font-bold uppercase tracking-widest shrink-0">
          ⚠ Educational use only · Not a substitute for medical advice
        </div>

        {/* Input Area */}
        <div className="px-4 pb-4 pt-3 bg-black/20 border-t border-white/5 shrink-0">
          <div className={`flex items-end gap-2 bg-white/5 border rounded-2xl px-4 py-2 transition-all ${isListening ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/10 hover:border-white/20'}`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? '🎤 Listening...' : 'Describe your symptoms…'}
              rows={1}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 resize-none outline-none leading-relaxed py-1 max-h-[100px]"
            />
            <div className="flex items-center gap-1 shrink-0 pb-1">
              <button
                onClick={handleVoiceInput}
                disabled={loading}
                className={`p-2 rounded-xl transition-all ${isListening ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse' : 'text-gray-500 hover:text-emerald-400 hover:bg-white/10'}`}
                title="Voice input"
              >
                {isListening ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading || isListening}
                className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[9px] text-gray-600 text-center mt-2 font-medium">Press Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
