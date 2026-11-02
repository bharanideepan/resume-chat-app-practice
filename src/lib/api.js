// Where the chat API lives. Empty (default) means the same origin as this page, which is what
// `npm run dev` uses (Vite forwards /api to the service). For a separately hosted build, set
// VITE_API_BASE_URL at build time, e.g. https://resume-service-practice.onrender.com
export function chatUrl(base = import.meta.env?.VITE_API_BASE_URL) {
  const root = String(base || '').trim().replace(/\/+$/, '');
  return `${root}/api/chat`;
}
