// Finds the generated resume link in an agent reply.
// The agent prints:  Download: [file_name.docx](https://.../downloads/<32 hex>.docx)
// and        Direct link: https://.../downloads/<32 hex>.docx

const URL_RE = /https?:\/\/[^\s)\]>"'`]+\/downloads\/([a-f0-9]{32})\.docx/i;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+\/downloads\/[a-f0-9]{32}\.docx)\)/i;

export function findResumeLink(text) {
  if (!text) return null;
  const md = MD_LINK_RE.exec(text);
  const raw = URL_RE.exec(text);
  const url = (md ? md[2] : raw?.[0]) || null;
  if (!url) return null;
  let fileName = md?.[1]?.trim();
  if (!fileName || !/\.docx$/i.test(fileName)) fileName = 'resume.docx';
  return { url, fileName, id: URL_RE.exec(url)?.[1] || '' };
}

/** "Mon 14:32" style time for the card. */
export function formatClock(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
