import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AmbientBackground } from '../components/layout/AmbientBackground';
import { Sidebar } from '../components/sidebar/Sidebar';
import { HeroGreeting } from '../components/chat/HeroGreeting';
import { ChatInput } from '../components/chat/ChatInput';
import { MessageBubble } from '../components/chat/MessageBubble';
import { AssistantMessage } from '../components/chat/AssistantMessage';
import { PiLogo } from '../components/ui/PiLogo';
import { getChatResponse } from '../api/chat';

let msgIdCounter = 0;

export default function HomePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState('SOVA 1.5 Pro');
  const [chatTitleBadge, setChatTitleBadge] = useState('');
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHero, setShowHero] = useState(true); // hero greeting shown after login
  const viewportRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  async function handleSend(text) {
    if (isStreaming) return;
    setShowHero(false);
    setIsStreaming(true);

    const userMsg = { id: msgIdCounter++, type: 'user', text };
    const assistantId = msgIdCounter++;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, type: 'assistant', markdown: null, animate: true }, // placeholder
    ]);
    scrollToBottom();

    try {
      const response = await getChatResponse(text);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, markdown: response } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, markdown: '> **Error:** Could not fetch a response. Please try again.' }
            : m
        )
      );
    }
    // streaming flag released by AssistantMessage onComplete
  }

  function handleSelectChat(chat) {
    setActiveChatId(chat.id);
    setChatTitle(chat.title);
    setChatTitleBadge('');
    setShowHero(false);
    setMessages([
      { id: msgIdCounter++, type: 'user', text: chat.title },
      {
        id: msgIdCounter++,
        type: 'assistant',
        markdown: chat.preview + '\n\nFeel free to ask follow-up questions!',
        animate: false,
      },
    ]);
    scrollToBottom();
  }

  function handleNewChat() {
    setActiveChatId(null);
    setChatTitle('SOVA 1.5 Pro');
    setChatTitleBadge('');
    setMessages([]);
    setShowHero(true);
    setIsStreaming(false);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative' }}>
      <AmbientBackground variant="home" />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 30,
          }}
          className="mobile-backdrop"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        activeId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle Sidebar"
              style={{
                padding: '8px', marginLeft: '-8px', borderRadius: '10px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            </button>
            {/* Chat title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PiLogo size="sm" />
              <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-main)' }}>
                {chatTitle}
              </span>
              {chatTitleBadge && (
                <span style={{
                  padding: '2px 8px', borderRadius: '9999px', fontSize: '11px',
                  background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.30)',
                  color: '#38bdf8',
                }}>
                  {chatTitleBadge}
                </span>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Sign in button */}
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '10px', fontSize: '12px',
                fontWeight: 500, color: 'var(--text-main)',
                background: 'none', border: '1px solid var(--sidebar-border)',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <svg width="14" height="14" fill="none" stroke="#38bdf8" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3" />
              </svg>
              <span>Sign in</span>
            </button>
            {/* Profile avatar */}
            <button
              onClick={() => navigate('/login')}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(192,132,252,0.30))',
                border: '1px solid rgba(56,189,248,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.60)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.30)')}
              title="Profile & Account — click to sign in"
            >
              <svg width="16" height="16" fill="none" stroke="#93c5fd" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 8, height: 8, borderRadius: '50%',
                background: '#10b981',
                border: '2px solid var(--bg-primary)',
              }} />
            </button>
          </div>
        </header>

        {/* Chat viewport */}
        <main
          ref={viewportRef}
          className="chat-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
            maxWidth: '1100px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {showHero || messages.length === 0 ? (
            <HeroGreeting onDemoPrompt={handleSend} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '8px' }}>
              {messages.map((msg) => {
                if (msg.type === 'user') {
                  return <MessageBubble key={msg.id} text={msg.text} />;
                }
                if (msg.type === 'assistant' && msg.markdown) {
                  return (
                    <AssistantMessage
                      key={msg.id}
                      markdown={msg.markdown}
                      animate={msg.animate}
                      onComplete={() => setIsStreaming(false)}
                    />
                  );
                }
                // Placeholder while fetching
                if (msg.type === 'assistant' && !msg.markdown) {
                  return (
                    <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '10px', background: 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(192,132,252,0.20))', border: '1px solid rgba(56,189,248,0.30)', flexShrink: 0 }} />
                      <div style={{ flex: 1, paddingTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#38bdf8', fontWeight: 500 }}>
                          <span className="animate-ping" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                          <span className="gemini-text-gradient">SOVA is thinking...</span>
                        </div>
                        {['75%', '100%', '83%'].map((w, i) => (
                          <div key={i} className="shimmer-bg" style={{ height: '14px', width: w, borderRadius: '6px', marginBottom: '8px' }} />
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </main>

        {/* Chat input */}
        <ChatInput onSend={handleSend} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
