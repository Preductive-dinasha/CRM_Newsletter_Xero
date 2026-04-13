# Preddi - AI Chat Agent Interface

## Overview
Preddi is a full-stack AI chat interface built with React + Vite + TailwindCSS (frontend) and Flask Clean Architecture (backend). It connects to n8n webhooks for specialist agents (@CRM, @Newsletter, @Xero) and OpenAI for general queries.

## Recent Changes
- 2026-04-13: Full rebuild — React+Vite+Tailwind frontend, Flask Clean Architecture backend, PostgreSQL, JWT httpOnly cookies
- 2026-03-11: Added skill selector — type `@` in chat to pick a skill; sent as `skill` field in n8n payload
- 2026-02-10: Rebranded to "Preddi", switched to light theme (#F9F9F9 bg, #308AD8 accent, #0A222C text)
- 2026-02-10: Improved n8n response parser to handle more response formats
- 2026-02-10: Initial build - Flask app with chat UI, n8n integration, file/image upload, voice-to-text

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
    __init__.py            # App factory: CORS, JWT, migrations, seed user
    config.py              # Config classes (Config, TestingConfig)
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
      auth_routes.py       # /api/auth/login, /api/auth/logout, /api/auth/refresh
      session_routes.py    # /api/sessions CRUD
      chat_routes.py       # /api/chat/<id> POST, /api/chat/<id>/history GET
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
    App.jsx                # Root: AuthProvider + AppContent (login or chat)
    main.jsx
    index.css              # Tailwind + custom prose styles
    api/
      client.js            # Axios with credentials + 401 → auth:unauthorized event
      auth.js              # login, logout, getMe
      sessions.js          # getSessions, createSession, deleteSession, updateTitle, getHistory, getSkills
      chat.js              # sendMessage (multipart form)
    context/
      AuthContext.jsx      # useAuth hook, user state, logout
    pages/
      LoginPage.jsx        # Login form with Preddi branding
      ChatPage.jsx         # Main chat: sidebar + message list + input
    components/
      Sidebar.jsx          # Dark sidebar: Preddi logo, New Chat, session list, user info
      MessageList.jsx      # Messages with typing indicator, markdown rendering
      MessageInput.jsx     # Textarea, file attach, @ skill selector button
      SkillSelector.jsx    # Dropdown for @ skill selection, SkillChip, SkillBadge
```

## Key Features
- Claude/ChatGPT-style UI: dark sidebar, light chat area
- JWT auth via httpOnly cookies (no localStorage for tokens)
- Agent routing: @CRM / @Newsletter / @Xero → n8n webhooks; General → OpenAI
- @-trigger skill selector in chat input
- Session management with auto-titling (OpenAI generates title from first message)
- Conversation history summarisation at 30 turns (oldest 20 compressed via OpenAI)
- File upload support (image, PDF, DOCX, etc.)
- Markdown rendering in agent responses
- 25 backend unit tests all passing

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Flask session secret
- `N8N_BEARER_TOKEN` - n8n webhook auth token
- `N8N_WEBHOOK_URL` - Base n8n webhook URL (for legacy support)
- `N8N_CRM_WEBHOOK_URL`, `N8N_NEWSLETTER_WEBHOOK_URL`, `N8N_XERO_WEBHOOK_URL` - Per-agent webhooks
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key (via Replit integration)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL (via Replit integration)
- `PREDDI_SKILLS` - Comma-separated skill names (default: CRM,Newsletter,Xero)
- `JWT_SECRET_KEY` - JWT signing secret

## Seed User
- Email: dinasha@preductive.co
- Password: Admin@1234

## API Endpoints
- `POST /api/auth/login` - Login, sets httpOnly JWT cookie
- `POST /api/auth/logout` - Clear JWT cookie
- `GET /api/users/me` - Current user info
- `GET /api/sessions` - List user's sessions
- `POST /api/sessions` - Create new session
- `PATCH /api/sessions/<id>` - Update session title
- `DELETE /api/sessions/<id>` - Delete session
- `POST /api/chat/<session_id>` - Send message (multipart: message, skill, file)
- `GET /api/chat/<session_id>/history` - Get chat history
- `GET /api/skills` - Available skills list
- `GET /api/health` - Health check

## Running
```bash
bash start.sh
```
Flask starts on port 8000, Vite serves frontend on port 5000.

## User Preferences
- AI agent name: "Preddi"
- Light chat area: background #F9F9F9, accent #308AD8, text #0A222C
- Dark sidebar like Claude/ChatGPT
- Python Flask backend
- React + Vite + Tailwind frontend (no Next.js)
- JWT in httpOnly cookies (not localStorage)
