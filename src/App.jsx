import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Welcome from './components/Welcome.jsx';
import Message from './components/Message.jsx';
import Composer from './components/Composer.jsx';
import { streamChat } from './lib/sseClient.js';

const newSessionId = () => (crypto.randomUUID?.() ?? String(Math.random())).replace(/-/g, '').slice(0, 10);
let counter = 0;
const nextId = () => `m${Date.now()}-${counter++}`;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [seed, setSeed] = useState(null);
  const sessionRef = useRef(newSessionId());
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const stickRef = useRef(true);
  const bufferRef = useRef({ id: null, text: '', raf: 0 });

  // Keep the view pinned to the newest text unless the user scrolls up to read.
  // Only the user's own scrolling can release the pin, never our programmatic scrolls.
  const onScroll = () => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) stickRef.current = true;
  };
  const releasePin = () => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight > 80) stickRef.current = false;
  };
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const patch = useCallback((id, fn) => {
    setMessages(list => list.map(m => (m.id === id ? { ...m, ...fn(m) } : m)));
  }, []);

  // Batch streamed text to one update per animation frame.
  const flush = useCallback(() => {
    const b = bufferRef.current;
    b.raf = 0;
    if (!b.id || !b.text) return;
    const { id, text } = b;
    b.text = '';
    patch(id, m => ({ content: m.content + text }));
  }, [patch]);

  const queueDelta = useCallback((id, text) => {
    const b = bufferRef.current;
    b.id = id;
    b.text += text;
    if (!b.raf) b.raf = requestAnimationFrame(flush);
  }, [flush]);

  const send = useCallback(async (text, { replaceId } = {}) => {
    const user = { id: nextId(), role: 'user', content: text, ts: Date.now() };
    const bot = { id: nextId(), role: 'assistant', content: '', status: 'streaming', ts: Date.now() };
    stickRef.current = true;
    setMessages(list => [...(replaceId ? list.filter(m => m.id !== replaceId) : list), ...(replaceId ? [] : [user]), bot]);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamChat({
        message: text,
        sessionId: sessionRef.current,
        signal: controller.signal,
        onDelta: t => queueDelta(bot.id, t)
      });
      cancelAnimationFrame(bufferRef.current.raf);
      flush();
      patch(bot.id, () => ({ status: 'done', ts: Date.now() }));
    } catch (err) {
      cancelAnimationFrame(bufferRef.current.raf);
      flush();
      if (err?.kind === 'aborted') patch(bot.id, () => ({ status: 'stopped' }));
      else patch(bot.id, () => ({ status: 'error', error: err?.message || 'Something went wrong.' }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }, [flush, patch, queueDelta]);

  // Side effects stay out of state updaters (StrictMode runs updaters twice). Read from a ref instead.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const retry = useCallback((botId) => {
    const list = messagesRef.current;
    const idx = list.findIndex(m => m.id === botId);
    const lastUser = [...list.slice(0, idx)].reverse().find(m => m.role === 'user');
    if (lastUser) send(lastUser.content, { replaceId: botId });
  }, [send]);

  const stop = () => abortRef.current?.abort();

  const newChat = () => {
    abortRef.current?.abort();
    cancelAnimationFrame(bufferRef.current.raf);
    bufferRef.current = { id: null, text: '', raf: 0 };
    sessionRef.current = newSessionId();
    setMessages([]);
    setSeed(null);
    setBusy(false);
  };

  const lastBotId = [...messages].reverse().find(m => m.role === 'assistant')?.id;

  return (
    <div className="app">
      <Header onNewChat={newChat} canReset={messages.length > 0} />
      <main className="stage">
        <div className="scroll" ref={scrollRef} onScroll={onScroll} onWheel={e => { if (e.deltaY < 0) stickRef.current = false; }} onTouchMove={releasePin} onKeyDown={e => { if (["PageUp","ArrowUp","Home"].includes(e.key)) stickRef.current = false; }}>
          <div className="column">
            {messages.length === 0 ? (
              <Welcome onPick={prompt => setSeed({ text: prompt, n: Date.now() })} disabled={busy} />
            ) : (
              <div className="thread" role="log" aria-live="polite" aria-label="Conversation">
                {messages.map(m => (
                  <Message
                    key={m.id}
                    message={m}
                    canRetry={!busy && m.id === lastBotId}
                    onRetry={() => retry(m.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <Composer busy={busy} onSend={send} onStop={stop} seed={seed} />
      </main>
    </div>
  );
}
