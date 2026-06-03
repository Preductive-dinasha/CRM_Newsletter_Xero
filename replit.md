# Preddi - AI Chat Agent Interface

## Overview
Preddi is a full-stack AI chat interface built with React + Vite + TailwindCSS (frontend) and Flask Clean Architecture (backend). It routes all messages through n8n webhooks to specialist agents (@CRM, @Newsletter, @Xero).

## Recent Changes
- 2026-04-18: n8n spacing normalisation — added `_normalise_spacing` to N8nService; converts n8n's double-space separator convention (`  - `, `  N)`) to proper markdown bullets and numbered lists; catch-all converts any remaining 2+ spaces to newlines; only fires when no real newlines are present (safe for already-structured responses); 47/47 backend tests passing
- 2026-04-18: React Router setup — BrowserRouter + Routes (/login, /signup, /) replacing page-state; LoginPage/SignupPage use useNavigate; protected route redirects to /login when unauthenticated
- 2026-04-18: n8n response rendering fix — _parse_response rewrote with safe JSON guards: unwraps double-encoded strings, restores \\n to real newlines, only JSON.loads on { or [ prefixed strings; fixed duplicate React key (msg.id || i → `${msg.id}-${i}`)
- 2026-04-18: Document file attachment in user bubbles — non-image files show a file icon + filename chip in the message bubble (file_name captured in ChatPage, rendered in MessageList)
- 2026-04-13: Removed inbuilt AI (OpenAI/General) agent — all messages now route to n8n webhooks only; backend raises ChatError if no valid agent selected; title generation uses first-6-words; summarisation uses word-based compression; agent dropdown always shows @CRM/@Newsletter/@Xero
- 2026-04-13: Task #3 fixes — auto-redirect after signup (no success screen), full Tailwind-only refactor (removed all inline style={} and <style> tags), file attachment inline preview in chat bubbles (file_preview blob URL on user messages), sidebar mobile hamburger toggle
- 2026-04-13: Task #3 complete — SignupPage with real-time password strength, mic button (Web Speech API), agent selector dropdown with localStorage persistence, image thumbnail preview in input, inline file images in bubbles, error state styling, agent badge in header, sidebar mobile toggle
- 2026-04-13: Full rebuild — React+Vite+Tailwind frontend, Flask Clean Architecture backend, PostgreSQL, JWT httpOnly cookies

## Architecture
- **Frontend**: React + Vite + TailwindCSS (Vite dev server on port 5000 in dev)
- **Backend**: Python Flask Clean Architecture (port 8000 in dev, port 5000 in production via gunicorn)
- **Database**: PostgreSQL via SQLAlchemy + Flask-Migrate
- **Auth**: JWT in httpOnly cookies (Flask-JWT-Extended)
- **Workflow**: `bash start.sh` starts Flask (port 8000) then Vite (port 5000)

## Project Structure
```
start.sh                   # Dev startup: Flask on 8000 + Vite on 5000
backend/
  run.py                   # Flask entrypoint (PORT env var, default 5000)
  migrations/              # Flask-Migrate Alembic migrations
  app/
    __init__.py            # App factory: CORS, JWT, migrations, seed user, SPA catch-all
    config.py              # Config classes with production secret validation
    extensions.py          # db, jwt, migrate, bcrypt
    models/
      user.py              # users table
      session.py           # sessions table
      chat_history.py      # chat_history table
    repositories/
      user_repository.py
      session_repository.py
      chat_repository.py
    services/
      auth_service.py      # register/login/password validation
      session_service.py   # create/list/delete/title sessions
      chat_service.py      # send_message, get_history, agent routing, title gen
      n8n_service.py       # POST to n8n webhooks
      summarisation_service.py  # compress history at 30 turns
      file_service.py      # save uploaded files
    routes/
      auth_routes.py       # /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/refresh
      session_routes.py    # /api/sessions CRUD
      chat_routes.py       # /api/chat/<id> POST, /api/chat/<id>/history GET, /api/upload POST
      user_routes.py       # /api/users/me
  tests/
    conftest.py
    test_auth_service.py
    test_chat_service.py
    test_n8n_service.py
    test_session_service.py
    test_summarisation_service.py
frontend/
  vite.config.js           # Vite config: port 5000, proxy /api → localhost:8000
  src/
    App.jsx                # Root: AuthProvider + page state (login/signup/chat)
    main.jsx
    index.css              # Tailwind + custom prose/scrollbar styles
    api/
      client.js            # Axios with credentials + CSRF interceptor + 401 → auth:unauthorized
      auth.js              # login, logout, getMe, register
      sessions.js          # getSessions, createSession, deleteSession, updateTitle, getHistory, getSkills
      chat.js              # sendMessage (multipart form)
    context/
      AuthContext.jsx      # useAuth hook, user state, logout
    hooks/
      useSpeech.js         # Web Speech API wrapper (start/stop/toggle, pulsing ring)
    pages/
      LoginPage.jsx        # Login form — Forgot password? link + Sign up link
      SignupPage.jsx        # Signup form — name/email/company/password with strength indicator
      ChatPage.jsx         # Main chat: sidebar + agent badge header + message list + input
    components/
      Sidebar.jsx          # Dark sidebar: Preddi logo, New Chat, session list, user info/logout
      MessageList.jsx      # Messages with typing indicator, markdown, error state, media_url images
      MessageInput.jsx     # Textarea + file attach + mic (pulsing ring) + agent dropdown + send
      SkillSelector.jsx    # @ dropdown for skill selection, SkillChip, SkillBadge
```

## Key Features
- Claude/ChatGPT-style UI: dark sidebar (#0A1929), light chat area (#F9F9F9, #308AD8 accent)
- JWT auth via httpOnly cookies (no localStorage for tokens)
- Signup with real-time password strength indicator (5 criteria, color-coded bars)
- Agent routing: @CRM / @Newsletter / @Xero — all via n8n webhooks (no General/OpenAI path)
- Agent selector dropdown in InputBar — persists last selection to localStorage; validated against allowed list on load
- Agent badge in chat header shows active agent
- @-trigger skill selector (type @ or click @ button)
- Mic button with Web Speech API — pulsing ring animation while recording
- File attach: drag-drop, paste clipboard images, file picker; image thumbnail preview before send; document filename chip for non-image files
- Inline image rendering in user bubbles (file_preview blob URL) and agent bubbles (media_url)
- Session management with auto-titling (first 6 words of reply, no LLM)
- Conversation summarisation at 30 turns (word-based compression, no LLM)
- Error messages rendered gracefully in chat (isError styling)
- Sidebar collapse toggle (hamburger button in header)
- 40 backend unit tests all passing

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Flask session secret (required in production)
- `JWT_SECRET_KEY` - JWT signing secret (required in production)
- `N8N_BEARER_TOKEN` - n8n webhook auth token
- `N8N_CRM_WEBHOOK_URL`, `N8N_NEWSLETTER_WEBHOOK_URL`, `N8N_XERO_WEBHOOK_URL` - Per-agent webhooks
- `PREDDI_SKILLS` - Comma-separated skill names (default: CRM,Newsletter,Xero)

## Seed User
- Email: dinasha@preductive.co
- Password: Admin@1234

## API Endpoints
- `POST /api/auth/register` - Register new user (f_name, l_name, email, password, company?)
- `POST /api/auth/login` - Login, sets httpOnly JWT cookie
- `POST /api/auth/logout` - Clear JWT cookie
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/users/me` - Current user info
- `GET /api/sessions` - List user's sessions
- `POST /api/sessions` - Create new session
- `PATCH /api/sessions/<id>` - Update session title
- `DELETE /api/sessions/<id>` - Delete session
- `POST /api/chat/<session_id>` - Send message (multipart: message, skill/agent, file)
- `GET /api/chat/<session_id>/history` - Get chat history
- `POST /api/upload` - Upload file separately
- `GET /api/uploads/<filename>` - Serve uploaded files
- `GET /api/skills` - Available skills list
- `GET /api/health` - Health check

## Running
```bash
bash start.sh
```
Flask starts on port 8000, Vite serves frontend on port 5000.

## Deployment
- Build: `cd frontend && npm install && npm run build`
- Run: `gunicorn --bind=0.0.0.0:5000 --reuse-port --workers=2 backend.run:app`
- Flask serves built `frontend/dist/` via SPA catch-all route in production

## User Preferences
- AI agent name: "Preddi"
- Light chat area: background #F9F9F9, accent #308AD8, text #0A222C
- Dark sidebar like Claude/ChatGPT (#0A1929)
- Python Flask backend
- React + Vite + Tailwind frontend (no Next.js)
- JWT in httpOnly cookies (not localStorage)
