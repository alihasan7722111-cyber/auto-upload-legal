import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const session = global.__tiktok_demo_session;
  if (!session || !session.access_token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const fileBuffer = await readRawBody(req);
    if (!fileBuffer) return res.status(400).json({ error: 'No file buffer received. Use small files for demo.' });

    const form = new FormData();
    form.append('access_token', session.access_token);
    form.append('video', fileBuffer, { filename: 'demo.mp4', contentType: 'video/mp4' });

    const uploadInitRes = await fetch('https://open-api.tiktok.com/v2/post/upload/', {
      method: 'POST',
      body: form
    });

    const uploadJson = await uploadInitRes.json();
    if (!uploadInitRes.ok) {
      console.error('Upload init error', uploadJson);
      return res.status(500).json(uploadJson);
    }

    const upload_id = uploadJson?.data?.upload_id || uploadJson?.data?.id || null;
    return res.json({ ok: true, upload_id, raw: uploadJson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (e) => reject(e));
  });
}
