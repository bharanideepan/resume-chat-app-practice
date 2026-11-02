# Resume Chat App (POC)

React chat screen for the Resource Management Group (RMG) to talk to the **Resume - All-in-One Agent** in Lyzr.
It is a **static site**: it has no server of its own and holds no secrets. It calls `POST /api/chat` on the
resume service (`../resume-generation-service`), which holds the Lyzr API key and forwards the message.

Styled after https://www.ideas2it.com/ : dark `#00020D` page, blue accent, Inter, white top bar, 8 px buttons,
14 px cards, gradient-border cards, thin outline icons on rounded tiles.

```
Static host                      Resume service (one server)                Lyzr
 chat site  --POST /api/chat-->  /api/chat  --x-api-key-->  agent
 (this app)  <-- SSE stream ---   also: /employees, /resumes, /downloads (unchanged)
```

## Develop

```bash
# terminal 1: the service (set LYZR_API_KEY in its .env first)
cd resume-generation-service && npm install && cp .env.example .env && npm start     # http://localhost:3000

# terminal 2: this app, with hot reload
cd resume-chat-app && npm install && npm run dev                                    # http://localhost:5173
```

In dev, Vite forwards `/api` to the service, so no CORS or URL setup is needed. If the service runs on another
port: `SERVICE_URL=http://localhost:4000 npm run dev`.

## Build and host separately

```bash
cd resume-chat-app
cp .env.example .env.production      # set VITE_API_BASE_URL to the service address
npm run build                        # outputs ./dist
```

1. Upload `dist/` to any static host (Render Static Site, S3 + CloudFront, Netlify, Azure Static Web Apps, nginx).
   It is a single-page app with no client-side routes, so no rewrite rules are needed.
2. On the **service**, add the site's address to `CHAT_ALLOWED_ORIGINS`, for example
   `CHAT_ALLOWED_ORIGINS=https://resume-chat.example.com`, and restart. Without this the browser blocks the call and the
   chat shows "Cannot reach the chat server".

`VITE_API_BASE_URL` is read at **build time** and ends up in the public JavaScript. It is only an address, not a secret.

## What the screen does

- Welcome screen with four starter prompts. A starter fills the message box so you can edit it before sending.
- Replies stream in as they are written, with Markdown (headings, lists, tables, links).
- A reply containing a `/downloads/<id>.docx` link gets a **resume card** with Download and Copy link.
- Stop, Try again after an error, New chat (new Lyzr session), Copy reply. Follow-ups reuse the same session.
- Scrolling up while a reply streams pauses auto-scroll.

## Tests

```bash
npm test                              # this app: SSE client, link detection, API URL (9 tests)
cd ../resume-generation-service && npm test    # 72 tests: chat proxy, stream parser, CORS
```

## Known limits

- **Lyzr's stream format is not documented.** The parser accepts SSE, newline-delimited JSON, raw text and one JSON
  document. If a real reply looks blank or duplicated, set `LYZR_DEBUG=1` on the service, repeat the question and read
  the log; `LYZR_MODE=chat` is a safe fallback.
- **No login.** CORS limits which *websites* may call the API from a browser; it does not authenticate people, and anyone
  can still call the service directly. Anyone who can open the chat page can use the agent and spend credits, so do not
  expose it publicly with a real key. Put SSO or network controls in front before sharing.
- Setting `API_KEY` on the service would block this page too, since a browser cannot send the bearer header safely
  (a key in the page would be public).
- **Usage limits.** The service caps requests per visitor and per day (defaults: 10 per minute, 2 at once, 200 per day).
  When a limit is hit the chat shows a plain message and a Try again button. See the service README to change them.
- Tool calls are not shown; only the reply text. No history: reloading starts a new chat.
- Download links expire (60 min) and are lost on a Render restart.
