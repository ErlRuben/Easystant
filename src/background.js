// Background Service Worker - Handles context menu creation and core logic

// Create context menu items on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'easystant-main',
        title: 'Easystant',
        contexts: ['selection']
    });

    console.log('Easystant context menu created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const selectedText = info.selectionText;

    if (selectedText) {
        // Store the text in storage so panel can access it
        chrome.storage.session.set({
            selectedText: selectedText
        }, () => {
            console.log('Text stored:', selectedText);
            // Open the extension popup
            chrome.action.openPopup();
        });
    }
});

// Listen for messages from content script and panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TEXT_SELECTED') {
        // Broadcast to all listeners
        console.log('Text selected:', request.text);
        sendResponse({ success: true });
    }
});

console.log('Easystant background service worker loaded');
