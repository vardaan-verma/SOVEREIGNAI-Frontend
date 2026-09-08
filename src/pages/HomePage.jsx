import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AmbientBackground } from '../components/layout/AmbientBackground';
import { Sidebar } from '../components/sidebar/Sidebar';
import { HeroGreeting } from '../components/chat/HeroGreeting';
import { ChatInput } from '../components/chat/ChatInput';
import { MessageBubble } from '../components/chat/MessageBubble';
import { AssistantMessage } from '../components/chat/AssistantMessage';
import { RoutingLogPanel } from '../components/chat/RoutingLogPanel';
import { AirGapBadge } from '../components/chat/AirGapBadge';
import { NetworkActivityPanel } from '../components/chat/NetworkActivityPanel';
import { PiLogo } from '../components/ui/PiLogo';
import { getChatResponse } from '../api/chat';
import { DEMO_CHATS } from '../data/demoChats';

let msgIdCounter = 0;

export default function HomePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState('SOVA');
  const [chatTitleBadge, setChatTitleBadge] = useState('');
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHero, setShowHero] = useState(true); // hero greeting shown after login
  const [routingLogOpen, setRoutingLogOpen] = useState(false);
  const [networkPanelOpen, setNetworkPanelOpen] = useState(false);
  const viewportRef = useRef(null);
  const routingHoverTimer = useRef(null);
  const networkHoverTimer = useRef(null);

  const handleRoutingMouseEnter = () => {
    if (routingHoverTimer.current) clearTimeout(routingHoverTimer.current);
    setRoutingLogOpen(true);
  };

  const handleRoutingMouseLeave = () => {
    routingHoverTimer.current = setTimeout(() => {
      setRoutingLogOpen(false);
    }, 200);
  };

  const handleNetworkMouseEnter = () => {
    if (networkHoverTimer.current) clearTimeout(networkHoverTimer.current);
    setNetworkPanelOpen(true);
  };

  const handleNetworkMouseLeave = () => {
    networkHoverTimer.current = setTimeout(() => {
      setNetworkPanelOpen(false);
    }, 200);
  };

  // Routing log is derived from whatever's currently in `messages`, not
  // stored separately — so switching chats or starting a new one clears it
  // automatically, and it can never show entries from a different chat.
  const routingLog = useMemo(
    () =>
      messages
        .filter((m) => m.type === 'assistant' && m.routing)
        .map((m) => ({
          id: m.id,
          time: m.receivedAt || '',
          model: m.routing.model,
          taskType: m.routing.taskType,
          externalCalls: m.routing.externalCalls ?? 0,
        }))
        .reverse(), // most recent first, matching the panel's prior ordering
    [messages]
  );

  // Read whatever LoginPage stored on successful auth. Re-checked on every
  // mount, so navigating here after logging in (or refreshing) reflects it.
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('sova_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  function handleLogout() {
    localStorage.removeItem('sova_session');
    setSession(null);
    navigate('/login');
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  async function handleSend(text, files = []) {
    if (isStreaming) return;
    setShowHero(false);
    setIsStreaming(true);

    const userMsg = { id: msgIdCounter++, type: 'user', text, files };
    const assistantId = msgIdCounter++;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, type: 'assistant', markdown: null, routing: null, animate: true }, // placeholder
    ]);
    scrollToBottom();

    try {
      const { markdown, routing } = await getChatResponse(text, files);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, markdown, routing, receivedAt: new Date().toLocaleTimeString() }
            : m
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
    setIsStreaming(false);

    const fullChat = DEMO_CHATS.find((c) => c.id === chat.id);
    if (!fullChat) {
      setMessages([]);
      return;
    }

    const loadedMessages = fullChat.messages.map((m) => ({
      id: msgIdCounter++,
      type: m.role, // 'user' | 'assistant'
      text: m.text,
      files: m.files,
      markdown: m.markdown,
      routing: m.routing,
      receivedAt: m.routing ? new Date().toLocaleTimeString() : undefined,
      animate: false, // replaying history — show instantly, no typewriter
    }));
    setMessages(loadedMessages);
    scrollToBottom();
  }

  function handleNewChat() {
    setActiveChatId(null);
    setChatTitle('SOVA Workbench');
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
            {/* Air-gap proof badge — reflects the real fetch log, not a static claim */}
            <AirGapBadge
              onClick={() => setNetworkPanelOpen((v) => !v)}
              onMouseEnter={handleNetworkMouseEnter}
              onMouseLeave={handleNetworkMouseLeave}
            />

            {/* Network activity toggle */}
            <button
              onClick={() => setNetworkPanelOpen((v) => !v)}
              onMouseEnter={(e) => {
                handleNetworkMouseEnter();
                if (!networkPanelOpen) e.currentTarget.style.background = 'var(--sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                handleNetworkMouseLeave();
                if (!networkPanelOpen) e.currentTarget.style.background = 'none';
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '10px', fontSize: '12px',
                fontWeight: 500, color: networkPanelOpen ? '#38bdf8' : 'var(--text-main)',
                background: networkPanelOpen ? 'rgba(56,189,248,0.10)' : 'none',
                border: '1px solid var(--sidebar-border)',
                cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span>Network activity</span>
            </button>

            {/* Routing log toggle — the demo-day "proof" button */}
            <button
              onClick={() => setRoutingLogOpen((v) => !v)}
              onMouseEnter={(e) => {
                handleRoutingMouseEnter();
                if (!routingLogOpen) e.currentTarget.style.background = 'var(--sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                handleRoutingMouseLeave();
                if (!routingLogOpen) e.currentTarget.style.background = 'none';
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '10px', fontSize: '12px',
                fontWeight: 500, color: routingLogOpen ? '#38bdf8' : 'var(--text-main)',
                background: routingLogOpen ? 'rgba(56,189,248,0.10)' : 'none',
                border: '1px solid var(--sidebar-border)',
                cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
              <span>Routing log</span>
              {routingLog.length > 0 && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                  ({routingLog.length})
                </span>
              )}
            </button>

            {session ? (
              /* Signed-in state: Profile Icon with User Name and Employee ID */
              <button
                onClick={handleLogout}
                title={`Signed in as ${session.name || 'User'} (${session.employee_id}) — Click to log out`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px 4px 6px',
                  borderRadius: '9999px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)')}
              >
                {/* Profile Icon Avatar */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    position: 'relative',
                    boxShadow: '0 2px 6px rgba(56, 189, 248, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  {(session.name || session.employee_id || 'U').charAt(0).toUpperCase()}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '1.5px solid #0f172a',
                    }}
                  />
                </div>

                {/* Name & Employee ID */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                    {session.name || 'Alex Mercer'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#7dd3fc', fontFamily: "'JetBrains Mono', monospace" }}>
                    {session.employee_id}
                  </span>
                </div>

                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                  &middot; Log out
                </span>
              </button>
            ) : (
              /* Signed-out state: ONLY Sign in / Register button */
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '10px', fontSize: '12px',
                  fontWeight: 500, color: 'var(--text-main)',
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(99,102,241,0.12))',
                  border: '1px solid rgba(56,189,248,0.30)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.60)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.30)')}
              >
                <svg width="14" height="14" fill="none" stroke="#38bdf8" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-5-4l5-5-5-5m5 5H3" />
                </svg>
                <span>Sign in / Register</span>
              </button>
            )}
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
                  return <MessageBubble key={msg.id} text={msg.text} files={msg.files} />;
                }
                if (msg.type === 'assistant' && msg.markdown) {
                  return (
                    <AssistantMessage
                      key={msg.id}
                      markdown={msg.markdown}
                      routing={msg.routing}
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

      {routingLogOpen && (
        <RoutingLogPanel
          entries={routingLog}
          onClose={() => setRoutingLogOpen(false)}
          onMouseEnter={handleRoutingMouseEnter}
          onMouseLeave={handleRoutingMouseLeave}
        />
      )}
      {networkPanelOpen && (
        <NetworkActivityPanel
          onClose={() => setNetworkPanelOpen(false)}
          shiftLeft={routingLogOpen}
          onMouseEnter={handleNetworkMouseEnter}
          onMouseLeave={handleNetworkMouseLeave}
        />
      )}
    </div>
  );
}