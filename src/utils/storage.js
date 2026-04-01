// Storage Utility - Handle Chrome storage API

/**
 * Save data to Chrome storage
 * @param {string} type - Type of data (fixChat, createTask, etc.)
 * @param {string} data - The data to save
 */
export async function saveToStorage(type, data) {
    try {
        const timestamp = new Date().toISOString();
        const item = {
            type,
            data,
            timestamp
        };

        // Get existing history
        const result = await chrome.storage.local.get('history');
        const history = result.history || [];

        // Add new item
        history.push(item);

        // Keep only last 50 items
        if (history.length > 50) {
            history.shift();
        }

        // Save back
        await chrome.storage.local.set({ history });

        console.log(`Saved ${type} to storage at ${timestamp}`);
        return true;
    } catch (error) {
        console.error('Storage save error:', error);
        return false;
    }
}

/**
 * Get data from Chrome storage
 * @param {string} key - The key to retrieve
 * @returns {Promise} - The stored data
 */
export async function getFromStorage(key) {
    try {
        const result = await chrome.storage.local.get(key);
        return result[key] || null;
    } catch (error) {
        console.error('Storage get error:', error);
        return null;
    }
}

/**
 * Get full history
 * @returns {Promise<Array>} - Array of all stored items
 */
export async function getHistory() {
    try {
        const result = await chrome.storage.local.get('history');
        return result.history || [];
    } catch (error) {
        console.error('History retrieval error:', error);
        return [];
    }
}

/**
 * Clear all history
 */
export async function clearHistory() {
    try {
        await chrome.storage.local.remove('history');
        return true;
    } catch (error) {
        console.error('Clear history error:', error);
        return false;
    }
}
