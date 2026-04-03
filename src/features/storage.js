// storage.js - Chrome storage management

const MAX_HISTORY = 50;

/**
 * Save a generated result to local history
 * @param {'fixChat' | 'createTask'} type
 * @param {string} data
 */
function saveToStorage(type, data) {
    try {
        const item = {
            type,
            data,
            timestamp: new Date().toISOString()
        };

        chrome.storage.local.get('history', (result) => {
            const history = result.history || [];
            history.push(item);

            // Trim to max history size
            while (history.length > MAX_HISTORY) {
                history.shift();
            }

            chrome.storage.local.set({ history }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Storage save error:', chrome.runtime.lastError);
                    return;
                }
                console.log(`Saved ${type} to history`);
            });
        });
    } catch (error) {
        console.error('saveToStorage error:', error);
    }
}