// api/history.js - Vercel serverless function for history management

const SUPABASE_URL = 'https://hqjxffuuefnztulgzipa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const MAX_HISTORY = 20;

async function supabase(method, path, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
        method,
        headers: {
            'Content-Type':  'application/json',
            'apikey':        SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer':        method === 'POST' ? 'return=representation' : ''
        },
        body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
    }
    return response.status === 204 ? null : response.json();
}

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // GET /api/history?type=fixChat — fetch history by type
        if (req.method === 'GET') {
            const { type } = req.query;
            if (!type || !['fixChat', 'createTask'].includes(type)) {
                return res.status(400).json({ error: 'Invalid type' });
            }

            const data = await supabase(
                'GET',
                `/history?type=eq.${type}&order=created_at.desc&limit=${MAX_HISTORY}`
            );

            return res.status(200).json({ history: data });
        }

        // POST /api/history — save new entry
        if (req.method === 'POST') {
            const { type, output, preview } = req.body;

            if (!type || !output || !preview) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Insert new entry
            await supabase('POST', '/history', { type, output, preview });

            // Count existing entries for this type
            const countRes = await fetch(
                `${SUPABASE_URL}/rest/v1/history?type=eq.${type}&select=id&order=created_at.asc`,
                {
                    headers: {
                        'apikey':        SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );
            const all = await countRes.json();

            // Delete oldest entries if over limit
            if (all.length > MAX_HISTORY) {
                const toDelete = all.slice(0, all.length - MAX_HISTORY);
                const ids = toDelete.map(r => r.id);
                await supabase('DELETE', `/history?id=in.(${ids.join(',')})`);
            }

            return res.status(200).json({ success: true });
        }

        // DELETE /api/history?id=xxx — delete single entry
        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'Missing id' });
            await supabase('DELETE', `/history?id=eq.${id}`);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('history handler error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
