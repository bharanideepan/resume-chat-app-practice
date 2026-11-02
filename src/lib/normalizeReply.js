// Cleans up agent text before it is rendered as Markdown.
//
// Some models write their reply like a JSON string: line breaks arrive as the two characters
// backslash + "n" (and quotes as backslash + quote) instead of real newlines, so Markdown shows
// "## Resume\n\nDownload: ..." as one flat line. This turns those escapes back into real characters.
//
// Always call it on the WHOLE accumulated reply, never on a single streamed chunk: a chunk can end
// between the backslash and the "n".

// Fenced blocks (including one still being streamed) and inline code are left exactly as written,
// so a code sample that really contains \n is not damaged.
const CODE = /(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g;

// \t is deliberately not converted: it would corrupt things like C:\temp, and a tab means nothing in chat Markdown.
function unescapeText(part) {
  return part
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/\\"/g, '"');
}

/**
 * @param {string} input   the reply text so far
 * @param {{streaming?: boolean}} [opts]  true while the reply is still arriving
 */
export function normalizeReply(input, { streaming = false } = {}) {
  if (typeof input !== 'string' || !input) return '';
  let text = input;

  // A reply wrapped in quotes as if it were a JSON string value: drop the outer quotes.
  if (text.length > 1 && text.startsWith('"') && text.endsWith('"') && /\\[nr"]/.test(text)) {
    text = text.slice(1, -1);
  }

  // While streaming, a lone trailing backslash is half of an escape that has not finished arriving.
  // Hide it for now so it does not flash on screen; the next chunk completes it.
  if (streaming && /(^|[^\\])\\$/.test(text)) text = text.slice(0, -1);

  // A reply that already has real line breaks is already formatted. Only treat the text as "escaped"
  // when the escaped breaks outnumber the real ones, so a stray "\\n" (e.g. C:\\new) in a good reply survives.
  const real = (text.match(/\n/g) || []).length;
  const escaped = (text.match(/\\n/g) || []).length;
  if (real > escaped) return text;

  return text
    .split(CODE)
    .map((part, i) => (i % 2 === 1 ? part : unescapeText(part)))
    .join('');
}
