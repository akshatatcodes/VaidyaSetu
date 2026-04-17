import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, Volume2, Sparkles, Activity, Heart, Shield } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

import { API_URL } from '../config/api';

const SUGGESTIONS = [
  { icon: Activity, text: 'Analyze my vitals', color: '#10b981' },
  { icon: Heart, text: 'Heart health tips', color: '#f43f5e' },
  { icon: Shield, text: 'Preventive care advice', color: '#3b82f6' },
];

const TypingDots = ({ isDark }) => (
  <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem' }}>
    {[0, 1, 2].map(i => (
      <span
        key={i}
        style={{
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '50%',
          background: '#10b981',
          display: 'block',
          animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
        }}
      />
    ))}
  </div>
);

const Chatbot = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme-aware styles
  const S = {
    chatWindow: {
      position: 'fixed',
      top: isMobile ? '4rem' : 'auto',
      // Keep chatbot fully above mobile bottom navigation + device safe area.
      bottom: isMobile ? 'calc(5.75rem + env(safe-area-inset-bottom, 0px))' : '1.5rem',
      right: isMobile ? '0' : '1.5rem',
      width: isMobile ? '100%' : '380px',
      maxWidth: isMobile ? '100%' : 'calc(100vw - 2rem)',
      height: isMobile ? 'auto' : 'auto',
      maxHeight: isMobile ? 'calc(100dvh - 10rem - env(safe-area-inset-bottom, 0px))' : '88vh',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: isMobile ? '1.25rem' : '2rem',
      background: isDark 
        ? 'linear-gradient(145deg, #030712 0%, #06121d 100%)'
        : 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
      boxShadow: isDark
        ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)'
        : '0 32px 80px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(16, 185, 129, 0.1)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.15)'}`,
      zIndex: 10050,
      transformOrigin: 'bottom right',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    header: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '1.25rem 1.5rem' : '1rem 1.5rem',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)'}`,
      flexShrink: 0,
      zIndex: 2,
      background: isDark
        ? 'linear-gradient(90deg, rgba(16,185,129,0.08) 0%, transparent 60%, rgba(20,184,166,0.04) 100%)'
        : 'linear-gradient(90deg, rgba(16,185,129,0.05) 0%, transparent 60%, rgba(16,185,129,0.02) 100%)',
    },
    aiTitle: {
      color: isDark ? '#ffffff' : '#0f172a',
      fontWeight: 900,
      fontSize: '0.875rem',
      letterSpacing: '-0.02em',
      margin: 0,
    },
    aiSubtitle: {
      color: '#10b981',
      fontWeight: 700,
      fontSize: '0.625rem',
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      margin: 0,
    },
    closeBtn: {
      padding: '0.5rem',
      borderRadius: '0.75rem',
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)'}`,
      cursor: 'pointer',
      color: isDark ? '#e5e7eb' : '#334155',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '2.25rem',
      minHeight: '2.25rem',
      zIndex: 3
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      background: isDark ? 'transparent' : '#ffffff',
    },
    aiBubble: {
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.05)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 185, 129, 0.1)'}`,
      borderRadius: '1.25rem 1.25rem 1.25rem 0',
      padding: '0.85rem 1.1rem',
      color: isDark ? '#e2e8f0' : '#334155',
      fontSize: isMobile ? '0.925rem' : '0.875rem',
      lineHeight: 1.6,
      maxWidth: '85%',
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(16, 185, 129, 0.05)',
    },
    userBubble: {
      background: 'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)',
      border: '1px solid rgba(59,130,246,0.3)',
      borderRadius: '1.25rem 1.25rem 0 1.25rem',
      padding: '0.85rem 1.1rem',
      color: '#ffffff',
      fontSize: isMobile ? '0.925rem' : '0.875rem',
      lineHeight: 1.6,
      maxWidth: '85%',
      boxShadow: '0 2px 12px rgba(37,99,235,0.3)',
    },
    aiAvatar: {
      width: '2rem',
      height: '2rem',
      borderRadius: '0.75rem',
      background: 'linear-gradient(135deg, #10b981, #14b8a6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
    },
    userAvatar: {
      width: '2rem',
      height: '2rem',
      borderRadius: '0.75rem',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
    },
    disclaimer: {
      padding: '0.5rem 1.25rem',
      background: isDark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.03)',
      borderTop: `1px solid ${isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)'}`,
      color: isDark ? 'rgba(245,158,11,0.7)' : 'rgba(180, 83, 9, 0.8)',
      fontSize: '0.5625rem',
      fontWeight: 700,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      flexShrink: 0,
    },
    inputArea: {
      padding: isMobile ? '1rem 1rem calc(1.35rem + env(safe-area-inset-bottom, 0px))' : '0.75rem 1rem 1rem',
      background: isDark ? 'rgba(0,0,0,0.2)' : '#f8faff',
      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)'}`,
      flexShrink: 0,
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '0.5rem',
      background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.2)'}`,
      borderRadius: '1.25rem',
      padding: '0.65rem 0.85rem',
    },
    textarea: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: isDark ? '#ffffff' : '#0f172a',
      fontSize: '0.925rem',
      lineHeight: 1.6,
      resize: 'none',
      maxHeight: '8rem',
      fontFamily: 'inherit',
      padding: '0.25rem 0',
    },
    sendBtn: {
      padding: '0.65rem',
      borderRadius: '0.875rem',
      background: 'linear-gradient(135deg, #10b981, #14b8a6)',
      border: 'none',
      cursor: 'pointer',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
      transition: 'all 0.2s',
      flexShrink: 0,
    },
    sendBtnDisabled: {
      opacity: 0.3,
      cursor: 'not-allowed',
    },
    micBtn: {
      padding: '0.65rem',
      borderRadius: '0.875rem',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: isDark ? '#6b7280' : '#94a3b8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      flexShrink: 0,
    },
    micBtnActive: {
      background: '#10b981',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
    },
    hintText: {
      color: isDark ? '#4b5563' : '#94a3b8',
      fontSize: '0.5625rem',
      textAlign: 'center',
      marginTop: '0.5rem',
      fontWeight: 500,
      margin: '0.5rem 0 0',
    },
    suggestionBtn: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.85rem 1.1rem',
      borderRadius: '1rem',
      background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(16, 185, 129, 0.15)'}`,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s',
      boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.02)',
    },
    suggestionText: {
      color: isDark ? '#9ca3af' : '#475569',
      fontSize: '0.8125rem',
      fontWeight: 500,
    },
    quickLabel: {
      color: isDark ? '#6b7280' : '#94a3b8',
      fontSize: '0.625rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
    },
    floatBtn: {
      position: 'fixed',
      bottom: isMobile ? 'calc(7.8rem + env(safe-area-inset-bottom, 0px))' : '1.5rem',
      right: isMobile ? '1.5rem' : '1.5rem',
      width: '3.5rem',
      height: '3.5rem',
      borderRadius: '1.25rem',
      background: 'linear-gradient(135deg, #10b981, #14b8a6)',
      border: 'none',
      cursor: 'pointer',
      color: '#ffffff',
      boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
      zIndex: 10040,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s',
    },
  };

  const smoothScrollToElement = (targetEl, topOffset = 16) => {
    const container = scrollContainerRef.current;
    if (!container || !targetEl) return;
    const containerTop = container.getBoundingClientRect().top;
    const targetTop = targetEl.getBoundingClientRect().top;
    const targetScrollPos = container.scrollTop + (targetTop - containerTop) - topOffset;
    
    container.scrollTo({
      top: targetScrollPos,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    
    // Use a small timeout to ensure DOM has updated
    const timer = setTimeout(() => {
      if (lastMsg.role === 'assistant') {
        // Scroll to the START of the assistant's response as requested
        if (lastAiMessageRef.current) {
          smoothScrollToElement(lastAiMessageRef.current, 12);
        }
      } else {
        // Scroll to the end for user messages
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [isOpen]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  const handleSend = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage) return;
    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const historyToSend = messages.length > 1 ? messages.slice(1) : [];
      const res = await axios.post(`${API_URL}/chat/symptom`, {
        clerkId: user?.id,
        message: userMessage,
        conversationHistory: historyToSend
      });
      if (res.data.status === 'success') {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err) {
      const reply = err.response?.data?.reply || 'Sorry, I am having trouble connecting. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
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

  const renderMessage = (content) => {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ fontWeight: 700, color: 'inherit' }}>{part}</strong>
              : part
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
        @keyframes chatGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.5), 0 0 0 0px rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 40px rgba(16,185,129,0.8), 0 0 0 20px rgba(16,185,129,0); }
        }
        @keyframes blinkEffect {
          0%, 100% { opacity: 1; transform: scale(1); filter: brightness(1.2); }
          50% { opacity: 0.3; transform: scale(1.5); filter: brightness(1); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          10%, 30% { transform: scale(1.1); }
          20% { transform: scale(1.15); }
        }
        .chatbot-float-btn { animation: chatGlow 2s ease-in-out infinite, heartbeat 4s ease-in-out infinite; }
        .chatbot-float-btn:hover { transform: scale(1.08) !important; animation: none; }
        .chatbot-float-btn:active { transform: scale(0.95) !important; }
        .chatbot-msg { animation: msgIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .chatbot-send-btn:not(:disabled):hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(16,185,129,0.5) !important; }
        .chatbot-close-btn:hover { transform: scale(1.1); color: #10b981 !important; }
        .chatbot-suggestion:hover { background: ${isDark ? 'rgba(255,255,255,0.08)' : '#f0fdf4'} !important; border-color: rgba(16, 185, 129, 0.4) !important; }
        .chatbot-mic-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.1)' : '#f0fdf4'} !important; color: #10b981 !important; }
        .chatbot-messages::-webkit-scrollbar { width: 4px; }
        .chatbot-messages::-webkit-scrollbar-track { background: transparent; }
        .chatbot-messages::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.2)'}; border-radius: 4px; }
      `}</style>

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-float-btn"
          style={S.floatBtn}
          title="Open AI Health Assistant"
        >
          <div style={{ position: 'relative' }}>
            {/* Outer Pulsing Ring */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '100%', height: '100%',
              background: '#10b981', borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'ringPulse 2s infinite',
              zIndex: -1
            }} />
            <MessageCircle style={{ width: '1.75rem', height: '1.75rem' }} />
            <span style={{
              position: 'absolute', top: '-0.35rem', right: '-0.35rem',
              width: '0.875rem', height: '0.875rem',
              background: '#6ee7b7', borderRadius: '50%',
              border: `2px solid ${isDark ? '#030712' : '#ffffff'}`,
              animation: 'blinkEffect 1.5s infinite',
              boxShadow: '0 0 10px #10b981',
            }} />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={S.chatWindow}>
          {/* Header */}
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem',
                  background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
                }}>
                  <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: '#ffffff' }} />
                </div>
                <span style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '0.875rem', height: '0.875rem',
                  background: '#10b981', borderRadius: '50%',
                  border: `2px solid ${isDark ? '#030712' : '#ffffff'}`,
                  animation: 'pulse 2s infinite',
                }} />
              </div>
              <div>
                <h3 style={S.aiTitle}>VaidyaSetu AI</h3>
                <p style={S.aiSubtitle}>Health Intelligence Engine</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close-btn"
              style={S.closeBtn}
              title="Close"
            >
              <X style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            className="chatbot-messages"
            style={S.messagesContainer}
          >
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isLastAi = !isUser && idx === messages.length - 1;
              const isLastUser = isUser && (
                !messages.slice(idx + 1).some(m => m.role === 'user')
              );
              
              return (
                <div
                  key={idx}
                  ref={isLastAi ? lastAiMessageRef : isLastUser ? lastUserMessageRef : null}
                  className="chatbot-msg"
                  style={{
                    display: 'flex',
                    gap: isMobile ? '0.5rem' : '0.75rem',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                  }}
                >
                  <div style={isUser ? S.userAvatar : S.aiAvatar}>
                    {isUser
                      ? <User style={{ width: '1rem', height: '1rem', color: '#ffffff' }} />
                      : <Bot style={{ width: '1rem', height: '1rem', color: '#ffffff' }} />
                    }
                  </div>
                  <div style={isUser ? S.userBubble : S.aiBubble}>
                    {renderMessage(msg.content)}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="chatbot-msg" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={S.aiAvatar}>
                  <Bot style={{ width: '1rem', height: '1rem', color: '#ffffff' }} />
                </div>
                <div style={{ ...S.aiBubble, padding: '0.5rem 0.75rem' }}>
                  <TypingDots isDark={isDark} />
                </div>
              </div>
            )}

            {/* Suggestion chips */}
            {showSuggestions && messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingTop: '0.5rem' }}>
                <p style={S.quickLabel}>Quick questions</p>
                {SUGGESTIONS.map(({ icon: Icon, text, color }) => (
                  <button
                    key={text}
                    onClick={() => handleSend(text)}
                    className="chatbot-suggestion"
                    style={S.suggestionBtn}
                  >
                    <Icon style={{ width: '1.15rem', height: '1.15rem', color, flexShrink: 0 }} />
                    <span style={S.suggestionText}>{text}</span>
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Disclaimer */}
          <div style={S.disclaimer}>
            ⚠ Educational use only · Not a substitute for medical advice
          </div>

          {/* Input Area */}
          <div style={S.inputArea}>
            <div style={{
              ...S.inputWrapper,
              borderColor: isListening ? 'rgba(16,185,129,0.8)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.2)',
              boxShadow: isListening ? '0 0 25px rgba(16,185,129,0.3)' : 'none',
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🎤 Listening...' : 'Describe your symptoms…'}
                rows={1}
                style={{
                  ...S.textarea,
                  caretColor: '#10b981',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, paddingBottom: isMobile ? '0.15rem' : '0.25rem' }}>
                <button
                  onClick={handleVoiceInput}
                  disabled={loading}
                  className="chatbot-mic-btn"
                  style={isListening ? { ...S.micBtn, ...S.micBtnActive } : S.micBtn}
                  title="Voice input"
                >
                  {isListening ? <Volume2 style={{ width: '1.25rem', height: '1.25rem' }} /> : <Mic style={{ width: '1.25rem', height: '1.25rem' }} />}
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading || isListening}
                  className="chatbot-send-btn"
                  style={(!input.trim() || loading || isListening) ? { ...S.sendBtn, ...S.sendBtnDisabled } : S.sendBtn}
                >
                  <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>
            </div>
            {!isMobile && <p style={S.hintText}>Press Enter to send · Shift+Enter for newline</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
