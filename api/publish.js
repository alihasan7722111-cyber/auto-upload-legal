import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const session = global.__tiktok_demo_session;
  if (!session || !session.access_token) return res.status(401).json({ error: 'Not authenticated' });

  const body = req.body || {};
  const upload_id = body.upload_id || (req.query && req.query.upload_id);
  const caption = body.caption || '';

  if (!upload_id) return res.status(400).json({ error: 'upload_id required' });

  const publishUrl = 'https://open-api.tiktok.com/v2/post/publish/';

  try {
    const r = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ upload_id, text: caption })
    });
    const j = await r.json();
    if (!r.ok) {
      console.error('Publish error', j);
      return res.status(500).json(j);
    }
    return res.json(j);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
