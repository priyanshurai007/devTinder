function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (magA * magB);
}

module.exports = cosineSimilarity;
