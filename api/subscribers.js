import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check token
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT id, email, created_at FROM subscribers ORDER BY created_at DESC`;
    return res.status(200).json({ ok: true, count: rows.length, subscribers: rows });
  } catch (err) {
    console.error('Subscribers fetch error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
