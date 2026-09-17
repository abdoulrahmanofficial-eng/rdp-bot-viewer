const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ ok: false, error: 'Missing BOT_TOKEN or CHAT_ID' });
  }

  try {
    const limit = req.query.limit || 100;

    const botInfo = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
    );

    const response = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`,
      {
        params: {
          limit: limit,
          allowed_updates: '["message"]'
        }
      }
    );

    const botId = botInfo.data.result.id;

    const messages = response.data.result
      .filter(update => update.message && update.message.chat.id.toString() === CHAT_ID && update.message.from.id === botId)
      .map(update => {
        const msg = update.message;
        return {
          id: msg.message_id,
          text: msg.text || msg.caption || '[Media Message]',
          date: msg.date,
          reply_to: msg.reply_to_message ? {
            id: msg.reply_to_message.message_id,
            text: msg.reply_to_message.text || msg.reply_to_message.caption || ''
          } : null,
          update_id: update.update_id
        };
      })
      .sort((a, b) => a.date - b.date);

    return res.status(200).json({
      ok: true,
      bot: botInfo.data.result,
      messages: messages,
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
