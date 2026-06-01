---
name: Frontend deps must install into frontend/
description: Why npm packages for the React app must go in frontend/, not the workspace root
---

Frontend npm packages (e.g. lucide-react) MUST be installed into `frontend/` (`npm install --prefix frontend <pkg>`), not the workspace root.

**Why:** This repo has a separate `package.json` at the workspace root AND in `frontend/`. The React app lives in `frontend/` with its own `node_modules` (and its own React). If a UI package is installed at the root, Vite's dep optimizer resolves that package's React from the root copy, producing TWO React instances → runtime "Invalid hook call" / "Cannot read properties of null (reading 'useContext')" and a blank screen. The package-management tool / a bare `npm install` defaults to the root, which is the wrong place for frontend libs.

**How to apply:** When adding any frontend library, run `npm install --prefix frontend <pkg>`, confirm it appears in `frontend/package.json` and `frontend/node_modules`, and ensure it is NOT in the root `package.json`. After installing, restart the "Start application" workflow so Vite re-bundles. If you hit the dual-React hook error, suspect a frontend dep that landed at the root.
