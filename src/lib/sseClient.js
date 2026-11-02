import { chatUrl } from './api.js';

// Browser side of POST /api/chat (see api.js for the base URL). The server replies with Server-Sent Events:
//   event: delta  data: {"text": "..."}
//   event: done   data: {"sessionId": "..."}
//   event: error  data: {"message": "..."}

/** Splits an SSE text buffer into complete blocks. Returns [events, rest]. */
export function parseSseBlocks(buffer) {
  const parts = buffer.replace(/\r\n/g, '\n').split('\n\n');
  const rest = parts.pop();
  const events = [];
  for (const block of parts) {
    let name = 'message';
    const data = [];
    for (const line of block.split('\n')) {
      if (line.startsWith(':') || line === '') continue;
      if (line.startsWith('event:')) name = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (!data.length) continue;
    try {
      events.push({ name, data: JSON.parse(data.join('\n')) });
    } catch {
      /* ignore a malformed block */
    }
  }
  return [events, rest];
}

export class ChatError extends Error {
  constructor(message, { kind = 'server' } = {}) {
    super(message);
    this.kind = kind; // 'network' | 'server' | 'aborted'
  }
}

export async function streamChat({ message, sessionId, signal, onDelta, fetchImpl = fetch, url = chatUrl() }) {
  let res;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
      signal
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw new ChatError('Stopped.', { kind: 'aborted' });
    throw new ChatError('Cannot reach the chat server. Check that it is running and try again.', { kind: 'network' });
  }

  if (!res.ok || !(res.headers.get('content-type') || '').includes('text/event-stream')) {
    let msg = `The chat server returned an error (${res.status}).`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* keep default */
    }
    throw new ChatError(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;
  let result = {};

  const handle = events => {
    for (const ev of events) {
      if (ev.name === 'delta' && typeof ev.data?.text === 'string') onDelta(ev.data.text);
      else if (ev.name === 'error') throw new ChatError(ev.data?.message || 'The agent reported an error.');
      else if (ev.name === 'done') { done = true; result = ev.data || {}; }
    }
  };

  try {
    for (;;) {
      const { value, done: finished } = await reader.read();
      if (finished) break;
      const [events, rest] = parseSseBlocks(buffer + decoder.decode(value, { stream: true }));
      buffer = rest;
      handle(events);
    }
    const [events] = parseSseBlocks(buffer + decoder.decode() + '\n\n');
    handle(events);
  } catch (err) {
    if (err instanceof ChatError) throw err;
    if (err?.name === 'AbortError') throw new ChatError('Stopped.', { kind: 'aborted' });
    throw new ChatError('The connection dropped before the reply finished.', { kind: 'network' });
  }

  if (!done) throw new ChatError('The connection dropped before the reply finished.', { kind: 'network' });
  return result;
}
