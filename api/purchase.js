import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const PIXEL_ID = process.env.TIKTOK_PIXEL_ID || 'DBRPNIBC77U73SF69QRG';
  const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || 'bfcead37dd35716e0a23f6d7af97d83cf0c6f845';

  try {
    const body = req.body || {};
    const hash256 = (str) => str ? crypto.createHash('sha256').update(String(str).trim().toLowerCase()).digest('hex') : undefined;
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const eventId = body.event_id || 'purchase_' + (body.order_id || Date.now());
    const valor = parseFloat(body.value || body.valor || 0);

    const user = {
      ip: clientIp,
      user_agent: userAgent
    };
    if (body.email) user.email = hash256(body.email);
    if (body.phone || body.telefone) user.phone = hash256(String(body.phone || body.telefone).replace(/\D/g, ''));
    if (body.ttclid) user.ttclid = body.ttclid;
    if (body.ttp) user.ttp = body.ttp;

    const payload = {
      event_source: 'web',
      event_source_id: PIXEL_ID,
      data: [
        {
          event: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          user,
          page: {
            url: body.page_url || ''
          },
          properties: {
            currency: body.currency || 'BRL',
            value: valor
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
    return res.status(200).json({ success: true, tiktok: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
