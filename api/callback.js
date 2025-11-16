import fetch from 'node-fetch';

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query.start) {
    const authorizeUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authorizeUrl.searchParams.set('client_key', CLIENT_KEY);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', 'user.info.basic,video.upload,video.publish');
    authorizeUrl.searchParams.set('state', 'auto-upload-demo');
    authorizeUrl.searchParams.set('redirect_uri', `${BASE_URL}/api/callback`);
    return res.redirect(authorizeUrl.toString());
  }

  if (req.method === 'GET' && req.query.code) {
    const { code } = req.query;
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    const body = new URLSearchParams();
    body.append('client_key', CLIENT_KEY);
    body.append('client_secret', CLIENT_SECRET);
    body.append('code', code);
    body.append('grant_type', 'authorization_code');
    body.append('redirect_uri', `${BASE_URL}/api/callback`);

    try {
      const tokRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });
      const tokJson = await tokRes.json();

      if (!tokRes.ok) {
        console.error('Token error', tokJson);
        return res.status(500).send('Token exchange failed: ' + JSON.stringify(tokJson));
      }

      global.__tiktok_demo_session = tokJson.data;
      return res.redirect('/upload.html');
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server error exchanging token');
    }
  }

  if (req.method === 'GET' && req.url.includes('/api/callback?session=1')) {
    const session = global.__tiktok_demo_session || null;
    return res.json(session);
  }

  res.status(400).send('Bad request to /api/callback');
}
