## DevTinder — Copilot instructions for code contributions

This file gives focused, actionable guidance for AI coding agents working in the DevTinder repository. Keep this short and practical — link to files and show examples rather than generic suggestions.

1) Purpose
- Make small, safe, repository-aware edits (bugfixes, small features, docs).
- Preserve existing architecture and conventions. If changes are large or risky, propose the change and ask before implementing.

2) Big-picture architecture (what to know first)
- Two main folders: `devTinder-backend/` (Node/Express + Mongoose) and `devTinder-frontend/` (React + Vite + Redux Toolkit + Tailwind).
- Backend responsibilities: authentication, feed generation, connection requests, and APIs under `devTinder-backend/src/routes/`. Look for business logic across `Models/`, `services/`, and `utils/`.
- Frontend responsibilities: UI, Redux slices, sockets and API calls in `devTinder-frontend/src/`. State is organized via slices in `src/utils/*Slice.js` and store in `src/utils/appStore.js`.

3) Key files & where to look for patterns (examples)
- Backend
  - `devTinder-backend/app.js` — app bootstrap and middleware registration.
  - `devTinder-backend/src/Middlewares/auth.js` — JWT cookie authentication; follow its usage for protected routes.
  - `devTinder-backend/src/routes/` — route handlers (auth, request, profile, search, chat); business logic is often inline here.
  - `devTinder-backend/src/Models/` — Mongoose schemas (user, message, connectionRequest). Use these to understand data shapes and validation rules.
  - `devTinder-backend/src/services/` and `utils/` — helper functions (chat service, chatbotService, cloudinary uploads, cosine similarity, embeddings).

- Frontend
  - `devTinder-frontend/src/utils/appStore.js` — Redux store wiring.
  - `devTinder-frontend/src/utils/*Slice.js` — patterns for async thunks, reducers and optimistic updates.
  - `devTinder-frontend/src/Components/ProtectedRoute.jsx` — how protected routes and auth flow are implemented.
  - `devTinder-frontend/src/utils/socket.js` — real-time socket integration; follow this when editing chat or real-time features.

4) Run & debug (concrete commands)
- Frontend (dev):
  - cd devTinder-frontend
  - npm install
  - npm run dev
  - The repository uses Vite; when editing React components, the dev server reloads automatically.
- Backend (dev):
  - cd devTinder-backend
  - npm install
  - Create a `.env` (see `devTinder-backend/README.md`) with DATABASE_URL, JWT_SECRET, PORT
  - npm start

5) Project-specific conventions and patterns
- Auth: backend uses JWT stored in httpOnly cookies. Routes that require auth use `src/Middlewares/auth.js` — prefer using that middleware rather than re-implementing checks.
- Requests/Feed: feed generation excludes self/connected/ignored/pending users using `$nin`/`$ne` queries — search `request`/`search` routes for example queries to reuse.
- Model validation: Mongoose schemas encode constraints (unique email/username, enum statuses for requests). Use mongoose validations over ad-hoc checks when possible.
- Routes structure: handlers live in `routes/`. Don't assume a separate controllers/ folder — modify the route file unless refactoring is requested.
- Frontend state: slices follow Redux Toolkit conventions (createSlice, async thunks). Look at `feedSlice.js`, `userSlice.js`, etc., to match naming and side-effect handling.

6) Integration points & external deps to be careful with
- Cloudinary uploads: `devTinder-backend/src/utils/cloudinary.js` — changes here can affect image uploads across the site.
- OpenAI/embeddings/chatbot helpers: `getEmbedding.js` and `chatbotService.js` — sensitive API keys and rate limits may apply; avoid committing keys.
- Socket / Realtime: Ensure backend and frontend socket code stay in sync when editing chat behavior (`chatService.js`, `devTinder-frontend/src/utils/socket.js`).

7) Safe edit checklist (apply before making changes)
- Run the appropriate dev server(s) locally (frontend: `npm run dev`; backend: `npm start`) and reproduce the issue.
- Update small unit of work and run the dev server(s) to validate no console errors are introduced.
- Avoid changing authentication or data-shape contracts without coordinating (these have wide impact).

8) Examples to copy from (search targets)
- Feed / requests logic: `devTinder-backend/src/routes/search.js`, `request.js`
- Auth and middleware: `devTinder-backend/src/routes/auth.js`, `src/Middlewares/auth.js`
- Redux pattern: `devTinder-frontend/src/utils/*Slice.js` and `appStore.js`

9) When to ask for clarification
- Major refactors (moving route code into controllers, changing db schema, altering auth flow).
- Any change that requires new environment variables or credentials.

If anything here is unclear or you'd like a different level of detail (more examples or test suggestions), tell me which section to expand and I'll iterate.
