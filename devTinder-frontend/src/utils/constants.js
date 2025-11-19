// Use a Vite environment variable when available, otherwise:
// - In dev (localhost), use localhost:3000
// - In production (deployed), use the deployed backend URL
export const BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? "http://localhost:3000"
    : "https://devtinder-vqbx.onrender.com");

// Example .env for frontend (Vite):
// VITE_API_URL=https://devtinder-vqbx.onrender.com

