// fixChat.js - Fix Chat feature: calls Vercel backend for AI-powered rewriting

const BACKEND_URL = 'https://your-project.vercel.app'; // ← replace with your Vercel URL after deploy

/**
 * Fix Chat: Improve communication using Claude AI via backend
 * @param {string} text - The text to fix
 * @param {string} tone - The desired tone (casual, professional, simple)
 * @returns {Promise<string>} - Formatted result
 */
async function fixChat(text, tone = 'professional') {
    try {
        const response = await fetch(`${BACKEND_URL}/api/fix-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, tone })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return `
📝 FIXED CHAT

Tone: ${tone.toUpperCase()}

Original:
"${text}"

Improved:
"${data.result}"
        `.trim();

    } catch (error) {
        // Fallback to local enhancement if backend is unavailable
        console.warn('Backend unavailable, using local fallback:', error.message);
        const improved = enhanceTextLocally(text, tone);
        return `
📝 FIXED CHAT (offline mode)

Tone: ${tone.toUpperCase()}

Original:
"${text}"

Improved:
"${improved}"
        `.trim();
    }
}

/**
 * Local fallback enhancement when backend is unavailable
 */
function enhanceTextLocally(text, tone) {
    let improved = text.trim();

    const replacements = {
        professional: {
            'wanna': 'want to', 'gonna': 'going to', 'gotta': 'got to',
            'kinda': 'kind of', 'sorta': 'sort of', 'btw': 'by the way',
            'pls': 'please', 'thx': 'thanks', 'u': 'you', 'ur': 'your',
            'idk': "I don't know", 'omg': 'oh my', 'lol': '',
            'yeah': 'yes', 'yep': 'yes', 'nope': 'no',
            "ain't": 'is not', "won't": 'will not', "can't": 'cannot'
        },
        casual: {
            'cannot': "can't", 'will not': "won't", 'could not': "couldn't",
            'is not': "isn't", 'have not': "haven't", 'has not': "hasn't",
            'please': 'pls', 'thanks': 'thx', 'by the way': 'btw'
        },
        simple: {
            'utilize': 'use', 'subsequently': 'then', 'regarding': 'about',
            'endeavor': 'try', 'facilitate': 'help', 'implement': 'do',
            'terminate': 'end', 'commence': 'start', 'however': 'but', 'therefore': 'so'
        }
    };

    const toneReplacements = replacements[tone];
    if (toneReplacements) {
        for (const [src, dst] of Object.entries(toneReplacements)) {
            const escaped = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
            improved = improved.replace(regex, dst);
        }
    }

    switch (tone) {
        case 'casual': {
            const isNegative = /(don't|can't|won't|not|down|error|fail|sorry|unfortunately)/i.test(improved);
            if (!isNegative) improved = improved.replace(/\.$/, '!');
            break;
        }
        case 'professional':
            improved = improved.charAt(0).toUpperCase() + improved.slice(1);
            improved = improved.replace(/!{2,}/g, '.').replace(/([a-z])!/g, '$1.').replace(/\?{2,}/g, '?');
            break;
        case 'simple':
            improved = improved.charAt(0).toUpperCase() + improved.slice(1);
            improved = improved.replace(/,\s+which\s+/gi, '. This ').replace(/,\s+that\s+/gi, '. That ');
            break;
        default:
            improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    }

    return improved.replace(/\s+/g, ' ').trim();
}