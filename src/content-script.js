// Content Script - Runs on web pages and detects text selection

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        if (request.type === 'GET_SELECTED_TEXT') {
            const selectedText = window.getSelection().toString();
            sendResponse({ text: selectedText });
            return true;
        }
    } catch (error) {
        console.error('Error in message listener:', error);
    }
});

// Listen for text selection on mouse up
document.addEventListener('mouseup', () => {
    try {
        const selectedText = window.getSelection().toString();
        if (selectedText.length > 0) {
            // Store selected text in session storage so panel can access it
            chrome.storage.session.set({ selectedText: selectedText });
        }
    } catch (error) {
        // Silently ignore errors
    }
});

console.log('Easystant content script loaded');
