const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { text, chat_id, message_id, date } = req.body;

    if (!text) {
      return res.status(400).json({ ok: false, error: 'Missing text field' });
    }

    const message = {
      id: message_id || Date.now(),
      from: 'bot',
      text: text,
      chat_id: chat_id,
      date: date || Math.floor(Date.now() / 1000)
    };

    const messages = (await redis.get('bot_messages')) || [];
    messages.push(message);

    if (messages.length > 500) {
      messages.splice(0, messages.length - 500);
    }

    await redis.set('bot_messages', messages);

    return res.status(200).json({
      ok: true,
      message: 'Message saved',
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
