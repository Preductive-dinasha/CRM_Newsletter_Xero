# n8n Chat Agent Interface

## Overview
A reusable Flask-based chat interface that connects to n8n workflows as the AI engine. Designed to be portable and embeddable into other Python and HTML/JS applications.

## Recent Changes
- 2026-02-10: Initial build - Flask app with chat UI, n8n integration, file/image upload, voice-to-text

## Architecture
- **Backend**: Python Flask (app.py) - handles API routing, session management, n8n webhook communication
- **Frontend**: Vanilla HTML/CSS/JS - no framework dependencies for maximum portability
- **Session Management**: Flask sessions with UUID-based session IDs passed to n8n for conversation history

## Project Structure
```
app.py                  # Flask application - main entry point
templates/index.html    # Chat interface HTML
static/css/style.css    # Chat UI styling (dark theme)
static/js/chat.js       # Chat client logic (messages, files, voice)
uploads/                # Temporary file storage (auto-cleaned)
```

## Key Features
- Text chat with n8n webhook integration
- Image/document upload and paste support
- Voice-to-text via browser Web Speech API
- Session ID management for n8n conversation history
- Markdown rendering for agent responses
- Image display from agent outputs
- Drag-and-drop file attachments

## Secrets Required
- `N8N_WEBHOOK_URL` - The n8n webhook URL for the agent
- `N8N_BEARER_TOKEN` - Bearer token for n8n webhook authentication
- `SESSION_SECRET` - Flask session secret (already set)

## API Endpoints
- `GET /` - Chat interface
- `GET /api/session` - Get current session ID
- `POST /api/session/reset` - Start new conversation
- `POST /api/chat` - Send message (supports multipart form with files)
- `GET /api/health` - Health check

## n8n Payload Format
Messages are sent as JSON to the n8n webhook:
```json
{
  "sessionId": "uuid-string",
  "message": "user message text",
  "chatInput": "user message text",
  "attachments": [{"filename": "...", "type": "image|document", "data": "base64..."}]
}
```

## Running
```bash
python app.py
```
Runs on port 5000.

## User Preferences
- Python Flask backend preferred
- Vanilla JS frontend (no React/framework)
- Dark theme UI
- Must be portable to other HTML/JS and Python apps
