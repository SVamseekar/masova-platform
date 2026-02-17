import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatMutation } from '../../store/api/agentApi';
import { useAppSelector } from '../../store/hooks';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';

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

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: 'Hi! I\'m MaSoVa\'s support assistant. I can help with order status, menu questions, complaints, and refunds. How can I help you?',
      ts: Date.now(),
    },
  ]);
  const sessionId = useRef(getOrCreateSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const customerId = useAppSelector((s) => (s.auth as any)?.user?.id as string | undefined);

  const [sendChat, { isLoading }] = useChatMutation();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await sendChat({
        message: text,
        sessionId: sessionId.current,
        customerId,
      }).unwrap();

      // Update session ID in case server generated one
      sessionId.current = res.sessionId;
      sessionStorage.setItem(SESSION_KEY, res.sessionId);

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'agent', text: res.reply, ts: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'agent',
          text: 'Sorry, I\'m having trouble connecting right now. Please try again or email support@masova.com.',
          ts: Date.now(),
        },
      ]);
    }
  }, [input, isLoading, sendChat, customerId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: spacing[6],
            width: '360px',
            maxHeight: '520px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.surface.primary,
            borderRadius: borderRadius.xl,
            boxShadow: shadows.raised.xl,
            border: `1px solid ${colors.surface.border}`,
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing[3]} ${spacing[4]}`,
              background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                M
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm }}>
                  MaSoVa Support
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: typography.fontSize.xs }}>
                  AI assistant · usually instant
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: 1,
                padding: spacing[1],
              }}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: spacing[4],
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[3],
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    backgroundColor: msg.role === 'user'
                      ? colors.brand.primary
                      : colors.surface.secondary,
                    color: msg.role === 'user' ? '#fff' : colors.text.primary,
                    fontSize: typography.fontSize.sm,
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxShadow: shadows.raised.sm,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: colors.surface.secondary,
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  <span style={{ letterSpacing: '2px' }}>···</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              display: 'flex',
              gap: spacing[2],
              padding: spacing[3],
              borderTop: `1px solid ${colors.surface.border}`,
              backgroundColor: colors.surface.primary,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: borderRadius.lg,
                border: `1.5px solid ${colors.surface.border}`,
                backgroundColor: colors.surface.secondary,
                color: colors.text.primary,
                fontSize: typography.fontSize.sm,
                outline: 'none',
                fontFamily: typography.fontFamily.primary,
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: borderRadius.lg,
                border: 'none',
                backgroundColor: input.trim() && !isLoading ? colors.brand.primary : colors.surface.border,
                color: '#fff',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                transition: 'background-color 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: spacing[6],
          right: spacing[6],
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryDark})`,
          color: '#fff',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: shadows.brand.primary,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? '×' : '💬'}
      </button>
    </>
  );
};

export default ChatWidget;
