// api/fix-chat.js - Vercel serverless function for Fix Chat feature

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, tone } = req.body;

    // Validate inputs
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Missing or invalid text' });
    }
    if (!tone || !['casual', 'professional', 'simple'].includes(tone)) {
        return res.status(400).json({ error: 'Invalid tone. Must be casual, professional, or simple' });
    }

    const toneInstructions = {
        casual:       'friendly, informal, and conversational. Use contractions, keep it relaxed but clear.',
        professional: 'formal, polished, and business-appropriate. Use proper grammar, avoid slang and contractions.',
        simple:       'clear, plain, and easy to understand. Use short sentences and common words. Avoid jargon.'
    };

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type':      'application/json',
                'x-api-key':         process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model:      'claude-haiku-4-5-20251001',
                max_tokens: 500,
                messages: [{
                    role:    'user',
                    content: `Rewrite the following message to be ${toneInstructions[tone]}

Return ONLY the rewritten message. No explanations, no quotes, no preamble.

Message to rewrite:
${text.trim()}`
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Anthropic API error:', error);
            return res.status(502).json({ error: 'AI service error.', detail: error });
        }

        const data = await response.json();
        const improved = data.content[0].text.trim();

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ result: improved });

    } catch (error) {
        console.error('fix-chat handler error:', error);
        return res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
}