---
name: Frontend deps install location
description: Where to install React-coupled npm packages in this Flask+Vite repo to avoid dual-React
---

# Install React-coupled packages into frontend/, never the repo root

This repo is a Flask backend + a Vite React app under `frontend/`. React lives in
`frontend/node_modules`. Any package that imports React (lucide-react, react-router-dom,
react-markdown, remark-gfm, etc.) MUST be installed into `frontend/`
(`npm install --prefix frontend <pkg>`), not the workspace root.

**Why:** Installing a React-coupled package at the repo root creates a second copy of
React in root `node_modules`. The bundler then resolves two React instances and the app
throws "Invalid hook call" at runtime. Keeping all React-coupled deps in `frontend/` keeps
a single React copy.

**How to apply:**
- Verify with `ls frontend/node_modules/<pkg>` (should exist) and `ls node_modules/react`
  (should NOT exist at root).
- When restoring `frontend/package.json` from a backup, run `npm install --prefix frontend`
  to pull listed deps (e.g. lucide-react) into the frontend tree only.
