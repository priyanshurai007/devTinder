#!/usr/bin/env node
const axios = require('axios');

// Usage: set SERVER_URL and TOKEN env vars, then run: node scripts/smoke_search.js
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const TOKEN = process.env.TOKEN; // cookie token value

async function main() {
  if (!TOKEN) {
    console.error('Please provide TOKEN env var (JWT cookie value) to authenticate the request');
    process.exit(1);
  }

  try {
    const res = await axios.get(`${SERVER_URL}/search`, {
      params: { query: 'React', limit: 5 },
      headers: { Cookie: `token=${TOKEN}` },
    });

    console.log('Search smoke results:');
    console.log('Total:', res.data.total);
    console.log('Returned:', res.data.data.length);
    console.log('Sample user ids:', res.data.data.map(u=>u._id));
  } catch (err) {
    console.error('Search smoke test failed:', err.response?.data || err.message);
    process.exit(2);
  }
}

main();
