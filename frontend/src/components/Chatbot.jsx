import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, X, Send, Bot, User, Mic, Volume2, Sparkles, 
  Activity, Shield, Stethoscope, Watch, QrCode, ArrowRight 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const QUICK_SUGGESTIONS = [
  { icon: Stethoscope, text: 'How do I use MediKiosk?', label: 'MediKiosk Guide', color: '#059669' },
  { icon: Shield, text: 'Can I take Ashwagandha with Warfarin?', label: 'Check Drug Safety', color: '#d97706' },
  { icon: Watch, text: 'How to sync Smartwatch or Google Fit?', label: 'Smartwatch Sync', color: '#2563eb' },
  { icon: Activity, text: 'Ayush guidance for Joint Pain & stiffness', label: 'Joint Pain (Sandhivata)', color: '#7c3aed' },
  { icon: QrCode, text: 'How does my ABHA Health ID work?', label: 'ABHA Card Info', color: '#0891b2' },
];

const TypingDots = () => (
  <div style={{ display: 'flex', gap: '0.35rem', padding: '0.4rem 0.6rem' }}>
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
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Namaste! 🙏 I am **VaidyaSetu AI**, your clinical and integrative health assistant for **SIH 2026 (PS 26047)**.\n\nI can help you with:\n- **MediKiosk Intake & OPD Tokens**\n- **Safety Bridge (Herb-Drug Interactions)**\n- **Smartwatch & Telemetry Vitals Sync**\n- **Ayush & Modern Clinical Triage**\n\nHow can I help you today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async (textToSend) => {
    const userMessage = (textToSend || input).trim();
    if (!userMessage) return;
    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const historyToSend = messages.length > 1 ? messages.slice(1) : [];
      const res = await axios.post(`${API_URL}/chat/symptom`, {
        clerkId: currentUser?.id || currentUser?._id || 'guest',
        message: userMessage,
        conversationHistory: historyToSend
      });
      if (res.data && res.data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Thank you for your inquiry. You can use MediKiosk for OPD booking, or check your active prescriptions under Clinical Records.' 
        }]);
      }
    } catch (err) {
      const fallbackReply = err.response?.data?.reply || 
        'I am currently connected in high-reliability mode. You can access MediKiosk intake at [/kiosk](/kiosk) or verify drug safety at [/patient/records](/patient/records).';
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackReply }]);
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
      alert('Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
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
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Render markdown with clickable navigation links
  const renderMessage = (content) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    return content.split('\n').map((line, lineIdx) => {
      // Split line by links first
      const elements = [];
      let lastIdx = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          elements.push({ type: 'text', text: line.substring(lastIdx, match.index) });
        }
        elements.push({ type: 'link', label: match[1], url: match[2] });
        lastIdx = linkRegex.lastIndex;
      }
      if (lastIdx < line.length) {
        elements.push({ type: 'text', text: line.substring(lastIdx) });
      }

      return (
        <span key={lineIdx} style={{ display: 'block', minHeight: line.trim() ? 'auto' : '0.5rem' }}>
          {elements.map((el, elIdx) => {
            if (el.type === 'link') {
              const isInternal = el.url.startsWith('/');
              return (
                <button
                  key={elIdx}
                  onClick={() => {
                    if (isInternal) {
                      setIsOpen(false);
                      navigate(el.url);
                    } else {
                      window.open(el.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#047857',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '0.375rem',
                    padding: '0.1rem 0.45rem',
                    margin: '0 0.2rem',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{el.label}</span>
                  <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              );
            }

            // Bold formatting
            const boldParts = el.text.split(/\*\*(.*?)\*\*/g);
            return boldParts.map((part, pIdx) =>
              pIdx % 2 === 1 ? (
                <strong key={pIdx} style={{ fontWeight: 700, color: '#0f172a' }}>
                  {part}
                </strong>
              ) : (
                part
              )
            );
          })}
        </span>
      );
    });
  };

  // Modern Light Theme Styles
  const S = {
    floatBtn: {
      position: 'fixed',
      bottom: isMobile ? 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' : '2rem',
      right: '1.75rem',
      width: '3.75rem',
      height: '3.75rem',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      color: '#ffffff',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 12px 30px rgba(5, 150, 105, 0.35)',
      zIndex: 9999,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    chatWindow: {
      position: 'fixed',
      bottom: isMobile ? 'calc(5rem + env(safe-area-inset-bottom, 0px))' : '2rem',
      right: isMobile ? '0.75rem' : '1.75rem',
      width: isMobile ? 'calc(100vw - 1.5rem)' : '410px',
      maxHeight: isMobile ? '78vh' : '620px',
      height: '600px',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '1.25rem',
      background: '#ffffff',
      boxShadow: '0 24px 60px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(226, 232, 240, 0.8)',
      border: '1px solid #e2e8f0',
      zIndex: 10000,
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 1.25rem',
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      color: '#ffffff',
      flexShrink: 0,
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '1rem 1.15rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem',
      background: '#f8fafc',
    },
    aiBubble: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '1rem 1rem 1rem 0.2rem',
      padding: '0.75rem 0.95rem',
      color: '#334155',
      fontSize: '0.875rem',
      lineHeight: 1.55,
      maxWidth: '88%',
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
    },
    userBubble: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      borderRadius: '1rem 1rem 0.2rem 1rem',
      padding: '0.75rem 0.95rem',
      color: '#ffffff',
      fontSize: '0.875rem',
      lineHeight: 1.55,
      maxWidth: '85%',
      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
    },
    aiAvatar: {
      width: '2rem',
      height: '2rem',
      borderRadius: '0.65rem',
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: '#ffffff',
    },
    userAvatar: {
      width: '2rem',
      height: '2rem',
      borderRadius: '0.65rem',
      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: '#ffffff',
    },
    disclaimer: {
      padding: '0.45rem 1rem',
      background: '#fffbeb',
      borderTop: '1px solid #fef3c7',
      color: '#b45309',
      fontSize: '0.6875rem',
      fontWeight: 600,
      textAlign: 'center',
      flexShrink: 0,
    },
    inputArea: {
      padding: '0.75rem 1rem',
      background: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      flexShrink: 0,
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '0.5rem',
      background: '#f8fafc',
      border: '1px solid #cbd5e1',
      borderRadius: '0.85rem',
      padding: '0.45rem 0.75rem',
    },
    textarea: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: '#0f172a',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      resize: 'none',
      maxHeight: '7rem',
      fontFamily: 'inherit',
      padding: '0.2rem 0',
    },
    sendBtn: {
      padding: '0.55rem',
      borderRadius: '0.65rem',
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      border: 'none',
      cursor: 'pointer',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
      flexShrink: 0,
    },
    micBtn: {
      padding: '0.55rem',
      borderRadius: '0.65rem',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    suggestionBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '0.65rem',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.15s ease',
      color: '#1e293b',
      fontSize: '0.8125rem',
      fontWeight: 500,
      width: '100%',
    }
  };

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes ringPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        .chatbot-messages::-webkit-scrollbar { width: 5px; }
        .chatbot-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={S.floatBtn}
          title="Open VaidyaSetu AI Assistant"
        >
          <div style={{ position: 'relative' }}>
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
              position: 'absolute', top: '-2px', right: '-2px',
              width: '0.75rem', height: '0.75rem',
              background: '#34d399', borderRadius: '50%',
              border: '2px solid #ffffff',
            }} />
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={S.chatWindow}>
          {/* Header */}
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '0.65rem',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: '#ffffff' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700 }}>VaidyaSetu AI</h3>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: '#d1fae5', fontWeight: 500 }}>
                  AIIA & Ayush Health Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.4rem',
                cursor: 'pointer',
                color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Close"
            >
              <X style={{ width: '1.15rem', height: '1.15rem' }} />
            </button>
          </div>

          {/* Messages Container */}
          <div ref={scrollContainerRef} className="chatbot-messages" style={S.messagesContainer}>
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '0.65rem',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                  }}
                >
                  <div style={isUser ? S.userAvatar : S.aiAvatar}>
                    {isUser ? <User style={{ width: '1rem', height: '1rem' }} /> : <Bot style={{ width: '1rem', height: '1rem' }} />}
                  </div>
                  <div style={isUser ? S.userBubble : S.aiBubble}>
                    {renderMessage(msg.content)}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end' }}>
                <div style={S.aiAvatar}>
                  <Bot style={{ width: '1rem', height: '1rem' }} />
                </div>
                <div style={{ ...S.aiBubble, padding: '0.35rem 0.5rem' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Smart Suggestions */}
            {showSuggestions && messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem' }}>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Quick Shortcuts & Clinical FAQ
                </p>
                {QUICK_SUGGESTIONS.map(({ icon: Icon, text, label, color }) => (
                  <button
                    key={text}
                    onClick={() => handleSend(text)}
                    style={S.suggestionBtn}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = color;
                      e.currentTarget.style.background = '#f1f5f9';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <Icon style={{ width: '1.05rem', height: '1.05rem', color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{label}</span>
                    <ArrowRight style={{ width: '0.75rem', height: '0.75rem', color: '#94a3b8' }} />
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Clinical Disclaimer */}
          <div style={S.disclaimer}>
            🛡️ AI Health Guidance · Not a substitute for emergency physician consultation
          </div>

          {/* Input Area */}
          <div style={S.inputArea}>
            <div style={{
              ...S.inputWrapper,
              borderColor: isListening ? '#10b981' : '#cbd5e1',
              boxShadow: isListening ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none',
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🎤 Listening to your voice...' : 'Ask about symptoms, medicines, or MediKiosk...'}
                rows={1}
                style={S.textarea}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                <button
                  onClick={handleVoiceInput}
                  disabled={loading}
                  style={{
                    ...S.micBtn,
                    color: isListening ? '#059669' : '#64748b',
                    background: isListening ? 'rgba(16,185,129,0.1)' : 'transparent',
                  }}
                  title="Speak symptoms (Bhashini AI Voice)"
                >
                  {isListening ? <Volume2 style={{ width: '1.15rem', height: '1.15rem' }} /> : <Mic style={{ width: '1.15rem', height: '1.15rem' }} />}
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading || isListening}
                  style={{
                    ...S.sendBtn,
                    opacity: (!input.trim() || loading || isListening) ? 0.4 : 1,
                    cursor: (!input.trim() || loading || isListening) ? 'not-allowed' : 'pointer'
                  }}
                  title="Send message"
                >
                  <Send style={{ width: '1.15rem', height: '1.15rem' }} />
                </button>
              </div>
            </div>
            {!isMobile && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.6875rem', color: '#94a3b8', textAlign: 'center' }}>
                Press Enter to send · Shift+Enter for newline
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
