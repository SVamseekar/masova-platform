import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useChatMutation } from '../../store/api/agentApi'
import { useAppSelector } from '../../store/hooks'
import { getChatTheme } from './chatWidgetTheme'
import './ChatWidget.css'

interface Message {
  id: string
  role: 'user' | 'agent'
  text: string
  ts: number
}

const SESSION_KEY = 'masova_chat_session_id'

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
)

const MicOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3-1.66 0-3 1.34-3 3v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c.57-.08 1.12-.24 1.64-.46L19.73 21 21 19.73 4.27 3z" />
  </svg>
)

const HeadsetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z" />
  </svg>
)

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const ChatWidget: React.FC = () => {
  const { pathname } = useLocation()
  const isProductSite = pathname === '/'
  const theme = useMemo(() => getChatTheme(isProductSite), [isProductSite])

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'agent', text: theme.welcome, ts: Date.now() },
  ])
  const [isListening, setIsListening] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)

  const sessionId = useRef(getOrCreateSessionId())
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const voiceModeRef = useRef(voiceMode)

  useEffect(() => { voiceModeRef.current = voiceMode }, [voiceMode])

  const customerId = useAppSelector((s) => s.auth.user?.id as string | undefined)
  const [sendChat, { isLoading }] = useChatMutation()

  const showQuickActions = messages.length === 1 && messages[0].id === 'welcome'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  const getSpeechRecognitionAPI = (): typeof SpeechRecognition | null => {
    const w = window as Window & {
      SpeechRecognition?: typeof SpeechRecognition
      webkitSpeechRecognition?: typeof SpeechRecognition
    }
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
  }

  const speakResponse = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.onend = () => {
      if (voiceModeRef.current) {
        setTimeout(() => startListeningFn(), 500)
      }
    }
    window.speechSynthesis.speak(utterance)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSendRef = useRef<((textOverride?: string) => Promise<void>) | undefined>(undefined)

  const startListeningFn = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI()
    if (!SpeechRecognitionAPI) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      if (voiceModeRef.current) {
        setTimeout(() => handleSendRef.current?.(transcript), 300)
      }
    }
    recognition.start()
    recognitionRef.current = recognition
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || isLoading) return

    setInput('')
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, ts: Date.now() }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await sendChat({ message: text, sessionId: sessionId.current, customerId }).unwrap()
      sessionId.current = res.sessionId
      sessionStorage.setItem(SESSION_KEY, res.sessionId)
      const reply = res.reply
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'agent', text: reply, ts: Date.now() }])
      if (voiceModeRef.current) speakResponse(reply)
    } catch {
      const errorText = "Sorry — I'm having trouble connecting. Try again in a moment, or email hello@masova.com."
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'agent', text: errorText, ts: Date.now() }])
      if (voiceModeRef.current) speakResponse(errorText)
    }
  }, [input, isLoading, sendChat, customerId, speakResponse])

  useEffect(() => { handleSendRef.current = handleSend }, [handleSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleVoiceMode = () => {
    const next = !voiceMode
    setVoiceMode(next)
    if (next) startListeningFn()
    else {
      stopListening()
      window.speechSynthesis?.cancel()
    }
  }

  const fabBottom = isProductSite ? 32 : 24
  const fabRight = isProductSite ? 32 : 24
  const panelBottom = isProductSite ? 100 : 88
  const panelRight = isProductSite ? 32 : 24

  const headerGradient = `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentDark} 55%, #0a0a0a 100%)`

  return (
    <>
      {open && (
        <div
          className="masova-chat-panel"
          role="dialog"
          aria-label={theme.title}
          style={{
            bottom: panelBottom,
            right: panelRight,
            width: 380,
            maxHeight: 540,
            background: theme.panelBg,
            border: `1px solid ${theme.panelBorder}`,
            boxShadow: theme.panelShadow,
            fontFamily: theme.fontFamily,
          }}
        >
          <div className="masova-chat-header" style={{ background: headerGradient }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className="masova-chat-avatar"
                style={{
                  background: theme.brandMuted,
                  border: `1px solid ${theme.brand}`,
                  color: theme.brand,
                }}
              >
                M
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{theme.title}</div>
                <div className="masova-chat-status">
                  <span className="masova-chat-status-dot" />
                  {voiceMode ? 'Voice mode on' : theme.subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="masova-chat-icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', width: 32, height: 32 }}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="masova-chat-messages" style={{ background: theme.messagesBg }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`masova-chat-row ${msg.role === 'user' ? 'masova-chat-row--user' : ''}`}
              >
                {msg.role === 'agent' && (
                  <div
                    className="masova-chat-row-avatar"
                    style={{
                      background: theme.brandMuted,
                      border: `1px solid ${theme.brand}`,
                      color: theme.brand,
                    }}
                  >
                    M
                  </div>
                )}
                <div>
                  <div
                    className={`masova-chat-bubble masova-chat-bubble--${msg.role}`}
                    style={
                      msg.role === 'user'
                        ? { background: theme.userBubbleBg, color: theme.userBubbleText }
                        : {
                            background: theme.agentBubbleBg,
                            color: '#e8e8e8',
                            border: `1px solid ${theme.agentBubbleBorder}`,
                          }
                    }
                  >
                    {msg.text}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.35)',
                      marginTop: 4,
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                      paddingLeft: msg.role === 'agent' ? 2 : 0,
                      paddingRight: msg.role === 'user' ? 2 : 0,
                    }}
                  >
                    {formatTime(msg.ts)}
                  </div>
                </div>
              </div>
            ))}

            {showQuickActions && (
              <div className="masova-chat-quick-actions">
                {theme.quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="masova-chat-chip"
                    style={{
                      border: `1px solid ${theme.accentBorder}`,
                      color: theme.accent,
                    }}
                    onClick={() => handleSend(action.message)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="masova-chat-row">
                <div
                  className="masova-chat-row-avatar"
                  style={{
                    background: theme.brandMuted,
                    border: `1px solid ${theme.brand}`,
                    color: theme.brand,
                  }}
                >
                  M
                </div>
                <div
                  className="masova-chat-bubble masova-chat-bubble--agent masova-chat-typing"
                  style={{
                    background: theme.agentBubbleBg,
                    border: `1px solid ${theme.agentBubbleBorder}`,
                  }}
                >
                  <span style={{ background: theme.accent }} />
                  <span style={{ background: theme.accent }} />
                  <span style={{ background: theme.accent }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="masova-chat-input-bar" style={{ background: theme.panelBg }}>
            <button
              type="button"
              className="masova-chat-icon-btn"
              onClick={toggleVoiceMode}
              title={voiceMode ? 'Exit voice mode' : 'Voice conversation'}
              style={{
                background: voiceMode ? theme.accentMuted : 'transparent',
                color: voiceMode ? theme.accent : 'rgba(255,255,255,0.5)',
                borderColor: voiceMode ? theme.accentBorder : 'rgba(255,255,255,0.1)',
              }}
            >
              <HeadsetIcon />
            </button>

            <input
              ref={inputRef}
              className="masova-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening…' : 'Type your message…'}
              disabled={isLoading}
              style={{
                background: theme.inputBg,
                color: '#f3f4f6',
                fontFamily: theme.fontFamily,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = theme.brand }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />

            <button
              type="button"
              className={`masova-chat-icon-btn ${isListening ? 'masova-chat-icon-btn--listening' : ''}`}
              onClick={isListening ? stopListening : startListeningFn}
              title={isListening ? 'Stop listening' : 'Voice input'}
              style={{
                background: isListening ? 'rgba(239,68,68,0.15)' : 'transparent',
                color: isListening ? '#ef4444' : 'rgba(255,255,255,0.5)',
              }}
            >
              {isListening ? <MicOffIcon /> : <MicIcon />}
            </button>

            <button
              type="button"
              className="masova-chat-send"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              style={{
                background: input.trim() && !isLoading ? theme.accent : theme.inputBg,
                color: input.trim() && !isLoading ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      <div
        className={`masova-chat-fab-wrap ${!open ? 'masova-chat-fab-wrap--pulse' : ''}`}
        style={{ bottom: fabBottom, right: fabRight }}
      >
        <button
          type="button"
          className={`masova-chat-fab ${open ? '' : 'masova-chat-fab--closed'}`}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close chat' : 'Open chat'}
          style={{
            width: open ? 52 : 'auto',
            height: 52,
            minWidth: 52,
            padding: open ? 0 : '0 18px 0 14px',
            borderRadius: open ? '50%' : 999,
            background: open ? theme.inputBg : theme.accent,
            color: '#fff',
            boxShadow: open ? '0 4px 20px rgba(0,0,0,0.5)' : theme.fabShadow,
            border: open ? `1px solid ${theme.panelBorder}` : 'none',
          }}
        >
          {open ? <CloseIcon /> : (
            <>
              <ChatIcon />
              <span className="masova-chat-fab-label">Chat</span>
            </>
          )}
        </button>
      </div>
    </>
  )
}

export default ChatWidget