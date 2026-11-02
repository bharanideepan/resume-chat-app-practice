import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSseBlocks, streamChat, ChatError } from '../src/lib/sseClient.js';
import { findResumeLink } from '../src/lib/resumeLink.js';

const enc = new TextEncoder();
function fakeFetch(chunks, { status = 200, type = 'text/event-stream' } = {}) {
  return async () => ({
    ok: status < 400,
    status,
    headers: { get: h => (h.toLowerCase() === 'content-type' ? type : null) },
    json: async () => JSON.parse(chunks.join('')),
    body: {
      getReader() {
        let i = 0;
        return { read: async () => (i < chunks.length ? { value: enc.encode(chunks[i++]), done: false } : { done: true }) };
      }
    }
  });
}
const ev = (name, data) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

test('parseSseBlocks keeps an unfinished block for the next read', () => {
  const [events, rest] = parseSseBlocks('event: delta\ndata: {"text":"a"}\n\nevent: delta\ndata: {"te');
  assert.equal(events.length, 1);
  assert.equal(events[0].data.text, 'a');
  assert.equal(rest, 'event: delta\ndata: {"te');
});

test('streamChat collects deltas across arbitrary chunk boundaries', async () => {
  const body = ev('delta', { text: 'Hel' }) + ev('delta', { text: 'lo\n\n**x**' }) + ev('done', { sessionId: 's1' });
  for (let cut = 1; cut < body.length; cut += 9) {
    let out = '';
    const r = await streamChat({
      message: 'hi', onDelta: t => (out += t),
      fetchImpl: fakeFetch([body.slice(0, cut), body.slice(cut)])
    });
    assert.equal(out, 'Hello\n\n**x**', `cut ${cut}`);
    assert.equal(r.sessionId, 's1');
  }
});

test('comment lines (keep-alive) are ignored', async () => {
  let out = '';
  await streamChat({
    message: 'hi', onDelta: t => (out += t),
    fetchImpl: fakeFetch([': keep-alive\n\n', ev('delta', { text: 'ok' }), ev('done', {})])
  });
  assert.equal(out, 'ok');
});

test('error event rejects with the server message', async () => {
  await assert.rejects(
    streamChat({ message: 'hi', onDelta() {}, fetchImpl: fakeFetch([ev('delta', { text: 'a' }), ev('error', { message: 'Tool failed' })]) }),
    err => err instanceof ChatError && err.message === 'Tool failed'
  );
});

test('stream that ends without done is reported as a dropped connection', async () => {
  await assert.rejects(
    streamChat({ message: 'hi', onDelta() {}, fetchImpl: fakeFetch([ev('delta', { text: 'a' })]) }),
    err => err.kind === 'network' && /dropped/.test(err.message)
  );
});

test('JSON error responses surface their message', async () => {
  await assert.rejects(
    streamChat({ message: 'hi', onDelta() {}, fetchImpl: fakeFetch([JSON.stringify({ error: 'The server is not configured.' })], { status: 503, type: 'application/json' }) }),
    err => err.message === 'The server is not configured.'
  );
});

test('network failure and abort are distinguished', async () => {
  await assert.rejects(
    streamChat({ message: 'hi', onDelta() {}, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } }),
    err => err.kind === 'network' && /Cannot reach/.test(err.message)
  );
  await assert.rejects(
    streamChat({ message: 'hi', onDelta() {}, fetchImpl: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; } }),
    err => err.kind === 'aborted'
  );
});

test('findResumeLink reads the markdown link and plain url', () => {
  const id = 'a'.repeat(32);
  const md = `**A. Resume**\nDownload: [ananya-krishnan-resume.docx](https://x.onrender.com/downloads/${id}.docx)\nDirect link: https://x.onrender.com/downloads/${id}.docx`;
  assert.deepEqual(findResumeLink(md), {
    url: `https://x.onrender.com/downloads/${id}.docx`, fileName: 'ananya-krishnan-resume.docx', id
  });
  const plain = findResumeLink(`Direct link: https://h.io/downloads/${id}.docx.`);
  assert.equal(plain.url, `https://h.io/downloads/${id}.docx`);
  assert.equal(plain.fileName, 'resume.docx');
  assert.equal(findResumeLink('No file was produced'), null);
  assert.equal(findResumeLink('https://h.io/downloads/short.docx'), null);
  assert.equal(findResumeLink(''), null);
});

test('chatUrl: same origin by default, absolute when a base URL is configured', async () => {
  const { chatUrl } = await import('../src/lib/api.js');
  assert.equal(chatUrl(undefined), '/api/chat');
  assert.equal(chatUrl(''), '/api/chat');
  assert.equal(chatUrl('https://svc.example.com'), 'https://svc.example.com/api/chat');
  assert.equal(chatUrl('https://svc.example.com///'), 'https://svc.example.com/api/chat');
  assert.equal(chatUrl('  http://localhost:3000/ '), 'http://localhost:3000/api/chat');
});

// ---- normalizeReply: turns escaped "\n" text back into real line breaks ----
import { normalizeReply } from '../src/lib/normalizeReply.js';

test('normalizeReply: the exact escaped reply seen from the agent becomes real lines', () => {
  const raw = '## A. Resume\\n\\nDownload: [a.docx](https://x.example/downloads/65d7b184d95e6b83309adc4f44b08681.docx)\\nDirect link: https://x.example/downloads/65d7b184d95e6b83309adc4f44b08681.docx\\n\\n- **Expires:** soon';
  const out = normalizeReply(raw);
  assert.equal(out, '## A. Resume\n\nDownload: [a.docx](https://x.example/downloads/65d7b184d95e6b83309adc4f44b08681.docx)\nDirect link: https://x.example/downloads/65d7b184d95e6b83309adc4f44b08681.docx\n\n- **Expires:** soon');
  assert.ok(!out.includes('\\n'));
});

test('normalizeReply: leaves text that is already correct alone', () => {
  const ok = '## Resume ready\n\n**Download:** [a.docx](https://x/y)\n- one\n- two';
  assert.equal(normalizeReply(ok), ok);
  assert.equal(normalizeReply(''), '');
  assert.equal(normalizeReply(undefined), '');
});

test('normalizeReply: escaped quotes and CRLF are fixed', () => {
  assert.equal(normalizeReply('group \\"Additional exposure\\"\\r\\nnext'), 'group "Additional exposure"\nnext');
});

test('normalizeReply: backslashes in ordinary text are not touched (no tab conversion, no false positives)', () => {
  assert.equal(normalizeReply('see C:\\temp\\files'), 'see C:\\temp\\files');
  assert.equal(normalizeReply('a\\tb'), 'a\\tb');
});

test('normalizeReply: a correctly formatted reply with a stray "\\n" in it is left alone', () => {
  const good = '## Notes\n\nThe file is at C:\\new\\report.\n- one\n- two\n- three';
  assert.equal(normalizeReply(good), good);
});

test('normalizeReply: code is left exactly as written', () => {
  const fenced = 'Use this:\\n```\nprintf("a\\nb")\n```\\nDone';
  assert.equal(normalizeReply(fenced), 'Use this:\n```\nprintf("a\\nb")\n```\nDone');
  assert.equal(normalizeReply('run `echo \\n` now\\nok'), 'run `echo \\n` now\nok');
});

test('normalizeReply: a reply wrapped in quotes like a JSON string loses the outer quotes', () => {
  assert.equal(normalizeReply('"## Hi\\n\\nThere"'), '## Hi\n\nThere');
  assert.equal(normalizeReply('"just a quoted word"'), '"just a quoted word"');
});

test('normalizeReply: streaming never shows a half-arrived escape, and the sum of chunks equals the whole', () => {
  const whole = '## A\\n\\nline one\\nline two\\n\\n- **x**';
  const expected = normalizeReply(whole);
  // Cut the reply at EVERY position, as if a chunk boundary fell there.
  for (let i = 1; i < whole.length; i += 1) {
    const partial = normalizeReply(whole.slice(0, i), { streaming: true });
    assert.ok(!/\\$/.test(partial), `dangling backslash when cut at ${i}`);
    assert.ok(expected.startsWith(partial), `partial text is not a prefix of the final text when cut at ${i}`);
  }
  assert.equal(normalizeReply(whole, { streaming: true }), expected);
});

test('normalizeReply: the resume link is still found after cleaning', () => {
  const raw = 'Download: [ananya-krishnan-resume.docx](https://resume-service-practice.onrender.com/downloads/65d7b184d95e6b83309adc4f44b08681.docx)\\nDirect link: https://resume-service-practice.onrender.com/downloads/65d7b184d95e6b83309adc4f44b08681.docx\\n\\nnext';
  const link = findResumeLink(normalizeReply(raw));
  assert.equal(link.fileName, 'ananya-krishnan-resume.docx');
  assert.equal(link.id, '65d7b184d95e6b83309adc4f44b08681');
  assert.equal(link.url, 'https://resume-service-practice.onrender.com/downloads/65d7b184d95e6b83309adc4f44b08681.docx');
  // The link finder already worked on the raw text, so the resume card was never the broken part.
  assert.equal(findResumeLink(raw)?.url, link.url);
});
