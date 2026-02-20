import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatMutation } from '../../store/api/agentApi';
import { useAppSelector } from '../../store/hooks';

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  ts: number;
}

const SESSION_KEY = 'masova_chat_session_id';

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// Inline SVG mic icons — avoids MUI icon-material dependency on this widget
const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const MicOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3-1.66 0-3 1.34-3 3v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c.57-.08 1.12-.24 1.64-.46L19.73 21 21 19.73 4.27 3z"/>
  </svg>
);

const VoiceModeIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? 'var(--red)' : 'currentColor'}>
    <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z"/>
  </svg>
);

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: "Hi! I'm MaSoVa's support assistant. I can help with order status, menu questions, complaints, and refunds. How can I help you?",
      ts: Date.now(),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  const sessionId = useRef(getOrCreateSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Keep a ref to voiceMode so callbacks inside recognition handlers see the current value
  const voiceModeRef = useRef(voiceMode);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  const customerId = useAppSelector((s) => (s.auth as any)?.user?.id as string | undefined);
  const [sendChat, { isLoading }] = useChatMutation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // ── Speech helpers ─────────────────────────────────────────────────────────

  const getSpeechRecognitionAPI = (): typeof SpeechRecognition | null => {
    const w = window as Window & {
      SpeechRecognition?: typeof SpeechRecognition;
      webkitSpeechRecognition?: typeof SpeechRecognition;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  };

  const speakResponse = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      // Re-listen only if still in voice mode (read current value via ref)
      if (voiceModeRef.current) {
        setTimeout(() => startListeningFn(), 500);
      }
    };
    window.speechSynthesis.speak(utterance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handleSend needs to be declared before startListeningFn because startListeningFn
  // calls it, but handleSend also calls speakResponse. We forward-declare via a ref.
  const handleSendRef = useRef<((textOverride?: string) => Promise<void>) | undefined>(undefined);

  const startListeningFn = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      if (voiceModeRef.current) {
        setTimeout(() => handleSendRef.current?.(transcript), 300);
      }
    };
    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ── Core send handler ──────────────────────────────────────────────────────

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await sendChat({ message: text, sessionId: sessionId.current, customerId }).unwrap();
      sessionId.current = res.sessionId;
      sessionStorage.setItem(SESSION_KEY, res.sessionId);
      const reply = res.reply;
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'agent', text: reply, ts: Date.now() }]);
      // Speak the reply if voice mode is active
      if (voiceModeRef.current) {
        speakResponse(reply);
      }
    } catch {
      const errorText = "Sorry, I'm having trouble connecting right now. Please try again or email support@masova.com.";
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'agent',
        text: errorText,
        ts: Date.now(),
      }]);
      if (voiceModeRef.current) {
        speakResponse(errorText);
      }
    }
  }, [input, isLoading, sendChat, customerId, speakResponse]);

  // Keep the ref in sync so recognition callbacks can call the latest handleSend
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleVoiceMode = () => {
    const next = !voiceMode;
    setVoiceMode(next);
    if (next) {
      startListeningFn();
    } else {
      stopListening();
      window.speechSynthesis?.cancel();
    }
  };

  // ── Derived style values (extracted from JSX to avoid IIFE in JSX) ─────────
  const listeningColor = isListening ? '#ef4444' : 'rgba(255,255,255,0.55)';
  const listeningAnimation = isListening ? 'micPulse 1s ease-in-out infinite' : 'none';
  const voiceModeColor = voiceMode ? 'var(--gold)' : 'rgba(255,255,255,0.55)';
  const sendBg = input.trim() && !isLoading ? 'var(--red)' : 'var(--surface-3)';
  const sendCursor = input.trim() && !isLoading ? 'pointer' : 'not-allowed';

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24,
          width: 360, maxHeight: 520,
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, zIndex: 9999, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          fontFamily: 'var(--font-body)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, var(--red) 0%, #8B1D06 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.35-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                  <circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/>
                </svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>MaSoVa Support</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem' }}>
                  {voiceMode ? '🎙 Voice mode active' : 'AI assistant · usually instant'}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%',
                  padding: '9px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--red)' : 'var(--surface-2)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-1)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  border: msg.role === 'agent' ? '1px solid var(--border)' : 'none',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '9px 14px', borderRadius: '16px 16px 16px 4px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block', animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)', alignItems: 'center' }}>
            {/* Voice mode toggle (full conversation mode) */}
            <button
              onClick={toggleVoiceMode}
              title={voiceMode ? 'Exit voice mode' : 'Start voice conversation'}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
                background: voiceMode ? 'rgba(198,42,9,0.15)' : 'var(--surface-2)',
                color: voiceModeColor,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.2s, color 0.2s',
              }}
            >
              <VoiceModeIcon active={voiceMode} />
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening…' : 'Ask me anything…'}
              disabled={isLoading}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 99,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)', fontSize: '0.875rem',
                outline: 'none', fontFamily: 'var(--font-body)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />

            {/* Tap-to-talk mic button */}
            <button
              onClick={isListening ? stopListening : startListeningFn}
              title={isListening ? 'Stop listening' : 'Voice input'}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
                background: isListening ? 'rgba(239,68,68,0.15)' : 'var(--surface-2)',
                color: listeningColor,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.2s',
                animation: listeningAnimation,
              }}
            >
              {isListening ? <MicOffIcon /> : <MicIcon />}
            </button>

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                background: sendBg,
                color: '#fff', cursor: sendCursor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: '50%',
          border: open ? '1px solid var(--border)' : 'none',
          background: open ? 'var(--surface-2)' : 'var(--red)',
          color: '#fff', cursor: 'pointer',
          boxShadow: open ? '0 4px 16px rgba(0,0,0,0.6)' : '0 8px 32px rgba(198,42,9,0.55)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes micPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
};

export default ChatWidget;
