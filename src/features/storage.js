// storage.js - Chrome local storage + Supabase history

const MAX_HISTORY = 20;

/**
 * Save result to both Chrome local storage and Supabase
 * @param {'fixChat' | 'createTask'} type
 * @param {string} output - Full output text
 */
function saveToStorage(type, output) {
    // Generate preview — first 120 chars of output
    const preview = output.replace(/\*\*/g, '').substring(0, 120).trim() + (output.length > 120 ? '...' : '');

    // Save to Supabase via backend
    fetch(`${BACKEND_URL}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, output, preview })
    }).catch(err => console.warn('Failed to save to Supabase:', err.message));

    // Also save to Chrome local storage as backup
    try {
        const item = {
            type,
            data: output,
            timestamp: new Date().toISOString()
        };

        chrome.storage.local.get('history', (result) => {
            const history = result.history || [];
            history.push(item);

            while (history.length > MAX_HISTORY) {
                history.shift();
            }

            chrome.storage.local.set({ history }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Storage save error:', chrome.runtime.lastError);
                }
            });
        });
    } catch (error) {
        console.error('saveToStorage error:', error);
    }
}