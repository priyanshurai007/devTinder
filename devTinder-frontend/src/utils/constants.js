// Prefer an explicit `VITE_API_URL` (set in your frontend deploy). If missing
// in production, warn so builds don't silently target the frontend origin.
const viteApiUrl = import.meta.env.VITE_API_URL;
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const isProdMode = import.meta.env.MODE === 'production' || !isLocalhost;

if (isProdMode && !viteApiUrl) {
  // This helps catch the common mistake where the frontend is built without
  // a backend URL and therefore tries to call itself (causes 404s).
  // You should set `VITE_API_URL` to your backend URL in CI / your host.
  // Example: VITE_API_URL=https://api.yourdomain.com
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_API_URL is not set. In production the frontend may call the frontend host instead of the backend — set VITE_API_URL to your backend URL."
  );
}

export const BASE_URL = viteApiUrl || (isLocalhost ? "http://localhost:3000" : "https://devtinder-vqbx.onrender.com");

// Helpful runtime debug: print the resolved API host so deployed builds
// clearly show which backend they are targeting (visible in DevTools).
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('BASE_URL =', BASE_URL);
}

// Example .env for frontend (Vite):
// VITE_API_URL=https://devtinder-vqbx.onrender.com

