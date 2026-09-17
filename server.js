require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/messages', async (req, res) => {
  try {
    const offset = req.query.offset || 0;
    const limit = req.query.limit || 100;

    const botInfo = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
    );

    const response = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`,
      {
        params: {
          offset: offset,
          limit: limit,
          allowed_updates: '["message"]'
        }
      }
    );

    const messages = response.data.result
      .filter(update => update.message && update.message.chat.id.toString() === CHAT_ID)
      .map(update => {
        const msg = update.message;
        const user = msg.from;
        return {
          id: msg.message_id,
          user: {
            id: user.id,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            username: user.username || ''
          },
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

    res.json({
      ok: true,
      bot: botInfo.data.result,
      messages: messages,
      total: messages.length
    });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
