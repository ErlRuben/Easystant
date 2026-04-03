// utils.js - Shared utility functions used across features

/**
 * Suggest priority level based on keywords in text
 * @param {string} text
 * @returns {'HIGH' | 'MEDIUM' | 'NORMAL'}
 */
function suggestPriority(text) {
    const urgent    = /urgent|asap|critical|immediately|emergency|broken|crash|error|bug/i;
    const important = /important|essential|must|should|required|help|need|issue|problem|doesn't work|can't/i;
    const emotional = /[!?]{2,}/i; // Multiple punctuation marks

    if (urgent.test(text) || emotional.test(text)) return 'HIGH';
    if (important.test(text)) return 'MEDIUM';
    return 'NORMAL';
}

/**
 * Capitalize the first letter of each word
 * @param {string} str
 * @returns {string}
 */
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get current date and time as separate strings
 * Captured once to avoid midnight mismatch bug
 * @returns {{ date: string, time: string }}
 */
function getCurrentTimestamp() {
    const now = new Date();
    return {
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0]
    };
}