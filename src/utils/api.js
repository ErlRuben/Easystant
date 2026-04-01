// API Utility - Handle API calls to AI services

/**
 * Call AI API for text processing
 * Configure your API endpoint and key here
 */

const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions'; // Change to your service
const API_KEY = process.env.REACT_APP_API_KEY || ''; // Store in env variables

/**
 * Generic API call wrapper
 * @param {string} prompt - The prompt to send to AI
 * @param {string} context - Optional context (fixChat, createTask, etc.)
 * @returns {Promise<string>} - AI response
 */
export async function callAI(prompt, context = 'general') {
    if (!API_KEY) {
        console.warn('API_KEY not configured. Using placeholder responses.');
        return getPlaceholderResponse(context);
    }

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: getSystemPrompt(context)
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API call failed:', error);
        throw new Error('Failed to get AI response: ' + error.message);
    }
}

/**
 * Get system prompt based on context
 */
function getSystemPrompt(context) {
    const prompts = {
        fixChat: 'You are a communication assistant. Help the user improve their message clarity, tone, and grammar. Be concise.',
        createTask: 'You are a task extraction specialist. Extract a clear, actionable task from the given text. Provide title, description, and priority.',
        general: 'You are a helpful assistant.'
    };

    return prompts[context] || prompts.general;
}

/**
 * Placeholder responses for when API is not configured
 */
function getPlaceholderResponse(context) {
    const responses = {
        fixChat: 'This is a placeholder. Configure your API key in the extension settings to enable AI-powered text improvement.',
        createTask: 'This is a placeholder. Configure your API key in the extension settings to enable AI-powered task creation.',
        general: 'Placeholder response - API not configured'
    };

    return responses[context] || responses.general;
}
