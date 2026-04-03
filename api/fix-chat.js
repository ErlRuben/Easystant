// api/fix-chat.js - Vercel serverless function using Google Gemini

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, tone } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Missing or invalid text' });
    }
    if (!tone || !['casual', 'professional', 'simple'].includes(tone)) {
        return res.status(400).json({ error: 'Invalid tone' });
    }

    const toneInstructions = {
        casual: `friendly, informal, and conversational. 
Rules:
- Keep ALL the original meaning, context, and key details intact
- Use casual language, contractions, and a relaxed tone
- Do not shorten or summarize — rewrite the full message
- Sound like a real person texting a colleague`,

        professional: `formal, polished, and business-appropriate.
Rules:
- Keep ALL the original meaning, context, and key details intact
- Use proper grammar, full words instead of abbreviations, no slang
- Do not shorten or summarize — rewrite the full message
- Sound like a professional email or workplace message`,

        simple: `clear, plain, and easy to understand.
Rules:
- Keep ALL the original meaning, context, and key details intact
- Use short sentences and common everyday words
- Avoid jargon, technical terms, and complex vocabulary
- Do not shorten or summarize — rewrite the full message`
    };

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a communication assistant. Rewrite the following message to be ${toneInstructions[tone]}

IMPORTANT: Preserve all details from the original. Do not cut anything out.
Return ONLY the rewritten message. No explanations, no quotes, no preamble.

Message to rewrite:
${text.trim()}`
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 2048,
                        temperature: 0.4
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Gemini API error:', error);
            return res.status(502).json({ error: 'AI service error. Please try again.', detail: error });
        }

        const data = await response.json();
        const improved = data.candidates[0].content.parts[0].text.trim();

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ result: improved });

    } catch (error) {
        console.error('fix-chat handler error:', error);
        return res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
}