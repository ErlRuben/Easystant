// api/create-task.js - Vercel serverless function using Google Gemini

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

    const { text, taskType } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Missing or invalid text' });
    }
    if (!taskType || !['bug', 'support', 'general'].includes(taskType)) {
        return res.status(400).json({ error: 'Invalid taskType' });
    }

    const prompts = {
        bug: `You are a software QA engineer. Extract a structured bug report from the following text.

Return ONLY a valid JSON object with exactly these fields, no markdown, no code fences, no explanation:
{
  "title": "concise bug title under 75 chars, prefixed with [BUG] or [REGRESSION] if applicable",
  "description": "clear 2-3 sentence description of the issue",
  "coreIssue": "the specific feature or system affected",
  "issueType": "bug or regression",
  "stepsToReproduce": "numbered steps as a single string separated by newlines",
  "expectedResult": "what should happen",
  "actualResult": "what actually happens",
  "priority": "HIGH, MEDIUM, or NORMAL"
}

Text to analyze:
${text.trim()}`,

        support: `You are a customer support specialist. Extract a structured support ticket from the following text.

Return ONLY a valid JSON object with exactly these fields, no markdown, no code fences, no explanation:
{
  "title": "concise issue title under 75 chars",
  "category": "one of: Technical Error, Performance Issue, Data Issue, Feature Issue, Regression - Feature Broken",
  "details": "2-3 sentence summary of the issue",
  "impact": "who or what is affected",
  "urgency": "Normal, High, or Critical/Urgent",
  "actions": "required actions as bullet points separated by newlines starting with *",
  "priority": "HIGH, MEDIUM, or NORMAL"
}

Text to analyze:
${text.trim()}`,

        general: `You are a project manager. Extract a structured task from the following text.

Return ONLY a valid JSON object with exactly these fields, no markdown, no code fences, no explanation:
{
  "title": "concise task title under 75 chars",
  "description": "2-3 sentence description of what needs to be done",
  "details": "specific requirements or details needed to complete the task",
  "deadline": "extracted deadline if mentioned, or null",
  "priority": "HIGH, MEDIUM, or NORMAL"
}

Text to analyze:
${text.trim()}`
    };

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompts[taskType] }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.3
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
        const rawText = data.candidates[0].content.parts[0].text.trim();

        // Parse JSON — strip markdown fences if model added them
        let parsed;
        try {
            const clean = rawText.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
            parsed = JSON.parse(clean);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', rawText);
            return res.status(502).json({ error: 'Failed to parse AI response. Please try again.' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ result: parsed, taskType });

    } catch (error) {
        console.error('create-task handler error:', error);
        return res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
}