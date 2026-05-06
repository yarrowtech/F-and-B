# Repository Guidelines

## Project Structure & Module Organization
This repository is split into two Node-based apps:
- `Frontend/`: Vite + React client. Main code lives in `Frontend/src`, static assets in `Frontend/public`, and lint config in `Frontend/eslint.config.js`.
- `Backend/`: Express + MongoDB API. Entry point is `Backend/server.js`; domain logic is organized across `controllers/`, `routes/`, `models/`, `middlewares/`, `utils/`, `config/`, and `constants/`.

Keep feature changes scoped by layer (route -> controller -> model) and avoid mixing unrelated frontend/backend edits in one commit.

## Build, Test, and Development Commands
Run commands from each package directory.

Frontend (`Frontend/`):
- `npm run dev`: start Vite dev server.
- `npm run build`: production build output to `dist/`.
- `npm run preview`: preview the production build.
- `npm run lint`: run ESLint on all frontend source files.

Backend (`Backend/`):
- `npm run server`: run API with `nodemon` for development.
- `npm run start`: run API with Node.
- `npm run seed`: seed initial data.
- `npm run reset:super-admin` / `npm run delete:super-admin`: admin credential maintenance scripts.

## Coding Style & Naming Conventions
- Use ES modules (`"type": "module"` in both packages).
- Use 2-space indentation and semicolon style consistent with existing files.
- React components: `PascalCase` filenames (example: `ManagerProfile.jsx`).
- Utility/service modules: `camelCase` or domain-oriented names (example: `attendance.service.js`).
- Run `Frontend/npm run lint` before opening a PR.

## Testing Guidelines
There is currently no committed automated test suite in either package. Until one is added:
- Include clear manual verification steps in PRs (endpoint, role, screen, expected result).
- For backend changes, validate affected API routes locally.
- For frontend changes, verify both desktop and mobile responsive behavior.

## Commit & Pull Request Guidelines
Recent history shows short, informal commit messages. For new work, prefer concise imperative messages with scope, e.g.:
- `frontend: fix waiter order card overflow`
- `backend: validate vendor payload before save`

PRs should include:
- What changed and why.
- Impacted areas (`Frontend/src/components/...`, `Backend/routes/...`).
- Screenshots/video for UI changes.
- Setup or data notes (seed/reset scripts) when relevant.
