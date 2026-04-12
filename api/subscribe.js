import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  // Validate presence
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ ok: false, error: 'Email is required' });
  }

  // Validate format (loose — real validation happens via confirmation email later)
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return res.status(400).json({ ok: false, error: 'Invalid email address' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // INSERT with ON CONFLICT so duplicates are a no-op, not an error
    await sql`
      INSERT INTO subscribers (email)
      VALUES (${trimmed})
      ON CONFLICT (email) DO NOTHING
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ ok: false, error: 'Server error. Please try again.' });
  }
}
