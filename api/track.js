export default async function handler(req, res) {
  // CORS liberado
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const PIXEL_ID = process.env.TIKTOK_PIXEL_ID || 'DBRPNIBC77U73SF69QRG';
  const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || 'bfcead37dd35716e0a23f6d7af97d83cf0c6f845';

  try {
    const body = req.body || {};
    const eventName = body.event || 'ClickButton';
    const eventId = body.event_id || 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || body.user_agent || '';

    const payload = {
      event_source: 'web',
      event_source_id: PIXEL_ID,
      data: [
        {
          event: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          user: {
            ...(body.ttclid ? { ttclid: body.ttclid } : {}),
            ...(body.ttp ? { ttp: body.ttp } : {}),
            ip: clientIp,
            user_agent: userAgent
          },
          page: {
            url: body.page_url || req.headers.referer || ''
          },
          properties: {
            currency: body.currency || 'BRL',
            value: Number(body.value || 0),
            ...(body.content_name ? { content_name: body.content_name } : {})
          }
        }
      ]
    };

    const resp = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    return res.status(200).json({ success: true, tiktok_response: data });
  } catch (err) {
    console.error('[TikTok CAPI] Erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
