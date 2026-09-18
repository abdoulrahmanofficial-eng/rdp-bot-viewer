export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/messages' && request.method === 'GET') {
      return this.handleGetMessages(env, corsHeaders);
    }

    if (url.pathname === '/api/log' && request.method === 'POST') {
      return this.handleLogMessage(request, env, corsHeaders);
    }

    if (url.pathname === '/api/migrate' && request.method === 'POST') {
      return this.handleMigrate(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },

  async handleGetMessages(env, corsHeaders) {
    try {
      const messages = await env.KV.get('bot_messages', { type: 'json' }) || [];
      return new Response(JSON.stringify({
        ok: true,
        messages: messages,
        total: messages.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        ok: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async handleLogMessage(request, env, corsHeaders) {
    try {
      const { text, chat_id, message_id, date } = await request.json();

      if (!text) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Missing text field'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const message = {
        id: message_id || Date.now(),
        from: 'bot',
        text: text,
        chat_id: chat_id,
        date: date || Math.floor(Date.now() / 1000)
      };

      const messages = await env.KV.get('bot_messages', { type: 'json' }) || [];
      messages.push(message);

      if (messages.length > 500) {
        messages.splice(0, messages.length - 500);
      }

      await env.KV.put('bot_messages', JSON.stringify(messages));

      return new Response(JSON.stringify({
        ok: true,
        message: 'Message saved',
        total: messages.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        ok: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async handleMigrate(request, env, corsHeaders) {
    try {
      const { messages } = await request.json();

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Missing messages array'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await env.KV.put('bot_messages', JSON.stringify(messages));

      return new Response(JSON.stringify({
        ok: true,
        message: 'Migration complete',
        total: messages.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        ok: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
