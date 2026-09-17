const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const limit = parseInt(req.query.limit) || 100;

    const messages = (await redis.get('bot_messages')) || [];
    const botMessages = messages.slice(-limit);

    return res.status(200).json({
      ok: true,
      messages: botMessages,
      total: messages.length
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};
