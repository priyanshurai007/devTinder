#!/usr/bin/env node
const axios = require('axios');

// Usage: set SERVER_URL and TOKEN env vars, then run: node scripts/smoke_chatbot.js
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const TOKEN = process.env.TOKEN; // cookie token value

async function main() {
  if (!TOKEN) {
    console.error('Please provide TOKEN env var (JWT cookie value) to authenticate the request');
    process.exit(1);
  }

  try {
    const res = await axios.post(`${SERVER_URL}/chatbot/message`, { message: 'Find connections' }, {
      headers: { Cookie: `token=${TOKEN}` }
    });

    console.log('Chatbot smoke response:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Chatbot smoke test failed:', err.response?.data || err.message);
    process.exit(2);
  }
}

main();
