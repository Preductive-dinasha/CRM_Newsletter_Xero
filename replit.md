# Preddi - Chat Agent Interface

## Overview
A reusable Flask-based chat interface ("Preddi") that connects to n8n workflows as the AI engine. Designed to be portable and embeddable into other Python and HTML/JS applications.

## Recent Changes
- 2026-03-11: Added skill selector — type `@` in chat to pick a skill; sent as `skill` field in n8n payload; PREDDI_SKILLS env var config
- 2026-02-10: Rebranded to "Preddi", switched to light theme (#F9F9F9 bg, #308AD8 accent, #0A222C text)
- 2026-02-10: Improved n8n response parser to handle more response formats (nested, wrapped, double-encoded)
- 2026-02-10: Initial build - Flask app with chat UI, n8n integration, file/image upload, voice-to-text

## Architecture
- **Backend**: Python Flask (app.py) - handles API routing, session management, n8n webhook communication
- **Frontend**: Vanilla HTML/CSS/JS - no framework dependencies for maximum portability
- **Session Management**: Flask sessions with UUID-based session IDs passed to n8n for conversation history

## Project Structure
```
app.py                  # Flask application - main entry point
templates/index.html    # Chat interface HTML
static/css/style.css    # Chat UI styling (light theme - Preddi brand)
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
- Skill selector: type `@` in chat input to pick a skill (e.g. Xero, Newsletter, CRM) — sent as `skill` field to n8n

## Environment Variables Required
- `N8N_WEBHOOK_URL` - The n8n webhook URL for the agent
- `N8N_BEARER_TOKEN` - API key for n8n webhook Header Auth (sent as X-API-Key header)
- `SESSION_SECRET` - Flask session secret (already set)
- `PREDDI_SKILLS` - Comma-separated list of skill names for the skill selector (e.g. `Xero,Newsletter,CRM`)

## API Endpoints
- `GET /` - Chat interface
- `GET /api/session` - Get current session ID
- `POST /api/session/reset` - Start new conversation
- `POST /api/chat` - Send message (supports multipart form with files)
- `GET /api/n8n-image?imageId=<id>` - Proxy to fetch images from n8n server (authenticated)
- `GET /api/skills` - Get available skills list (from PREDDI_SKILLS env var)
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

## n8n Image Response Formats
Images from n8n can be sent in several ways:

1. **Base64 data URI** (recommended for security - no public URL needed):
```json
{"output": "Here's your image!", "image": "data:image/png;base64,iVBORw0KGgo..."}
```

2. **Raw base64 string** (auto-detected if >200 chars and not a URL):
```json
{"output": "Result:", "image": "iVBORw0KGgo..."}
```

3. **Media objects with base64 data**:
```json
{"media": [{"type": "image", "data": "base64...", "mime": "image/png", "name": "chart.png"}]}
```

4. **Public URLs** (still supported):
```json
{"image": "https://example.com/photo.png"}
```

5. **Media objects with imageId** (auto-proxied through Flask with auth):
```json
{"output": "Here's the image:", "media": [{"type": "image", "imageId": "mlmih378at64w61a.png", "mime": "image/png", "name": "car_auckland.png"}]}
```

Supported keys: `image`, `images`, `media`, `files`, `attachments`

For the `imageId` format, Preddi will POST to `/webhook/getimage` on your n8n server with `{"imageId": "..."}` in the request body.

Note: Double-encoded JSON responses (where `output` contains a JSON string with nested `output` and `media`) are automatically unwrapped and parsed correctly.

## Running
```bash
python app.py
```
Runs on port 5000.

## User Preferences
- AI agent name: "Preddi"
- Light theme: background #F9F9F9, accent/icons #308AD8, text #0A222C
- Python Flask backend preferred
- Vanilla JS frontend (no React/framework)
- Must be portable to other HTML/JS and Python apps
