const connectDB = require('../src/Config/database');
const mongoose = require('mongoose');
const getEmbedding = require('../src/utils/getEmbedding');
const User = require('../src/Models/user');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  try {
    await connectDB();
    console.log('Starting embedding generation script...');

    // Find users without embeddings
    const users = await User.find({ $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }] });
    console.log(`Found ${users.length} users missing embeddings.`);

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const skillsText = Array.isArray(u.skills) ? u.skills.join(' ') : '';
      const inputText = `${skillsText} ${u.about || ''}`.trim();
      if (!inputText) {
        // skip users without profile text
        continue;
      }
      try {
        const emb = await getEmbedding(inputText);
        if (Array.isArray(emb) && emb.length > 0) {
          u.embedding = emb;
          u.embeddingUpdatedAt = new Date();
          await u.save();
          console.log(`Updated embedding for user ${u._id} (${i+1}/${users.length})`);
        } else {
          console.log(`Embedding not returned for user ${u._id}`);
        }
      } catch (err) {
        console.error(`Error embedding user ${u._id}:`, err.message || err);
      }

      // polite delay to avoid rate limits
      await sleep(500);
    }

    console.log('Embedding generation completed.');
    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
}

main();
