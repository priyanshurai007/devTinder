# Deploy checklist — Frontend & Backend environment variables

This file lists minimal steps to ensure the frontend talks to the backend and sensitive secrets are kept safe.

1) Frontend (Vite) — set backend URL

- Add an environment variable to your frontend deploy: `VITE_API_URL`
  - Value: the deployed backend URL, e.g. `https://devtinder-backend.example.com`
  - On Render / Vercel: set this in the project settings for the Production environment.

- Re-deploy the frontend so the build includes the correct `BASE_URL`.

2) Backend — allowed frontend origins

- The backend reads allowed frontends from `FRONTEND_URL` (comma-separated) plus defaults.
- Set `FRONTEND_URL` in your backend deploy if your frontend origin is different from the defaults.
  - Example: `FRONTEND_URL=https://devtinder-vqbx.onrender.com`

3) Cookies & production

- Ensure `NODE_ENV=production` is set in production and/or your platform provides `x-forwarded-proto`.
- Backend will then send cookies with `SameSite=None; Secure` so browsers accept cross-site cookies for auth.

4) Rotate secrets if leaked

- If `.env` was committed or pushed anywhere public, rotate these immediately:
  - MongoDB user/password (create a new DB user and update `MONGO_URI`)
  - `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`
  - `JWT_SECRET`

- Consider purging `.env` from git history using BFG or `git filter-repo` (this rewrites history — coordinate with collaborators).

5) Quick tests after deploy

- Check backend health:

```powershell
curl https://<your-backend-host>/health
```

- Load the frontend and open browser DevTools (Network/Console) to confirm:
  - `GET <backend>/profile/view` returns 200 for authenticated requests.
  - Socket connection goes to `https://<your-backend-host>/socket.io/` and negotiates successfully.

If you want, I can generate step-by-step Render/Vercel screenshots or commands for updating env vars.
