// panel.js - UI only: event listeners, display, and flow control
// UI state
let selectedText = '';
let currentFlow  = null; // 'fixChat' | 'createTask'

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
document.addEventListener('DOMContentLoaded', () => {

    // --- Element references ---
    const actionsSection    = document.getElementById('actions');
    const fixChatBtn        = document.getElementById('fix-chat-btn');
    const createTaskBtn     = document.getElementById('create-task-btn');

    const toneSelector      = document.getElementById('tone-selector');
    const toneButtons       = document.querySelectorAll('.tone-btn');
    const toneCancelBtn     = document.getElementById('tone-cancel');

    const taskTypeSelector  = document.getElementById('task-type-selector');
    const taskTypeButtons   = document.querySelectorAll('.task-type-btn');
    const taskCancelBtn     = document.getElementById('task-cancel');

    const resultContainer   = document.getElementById('result-container');
    const resultContent     = document.getElementById('result-content');
    const copyBtn           = document.getElementById('copy-btn');
    const backBtn           = document.getElementById('back-btn');

    // --- Load selected text from session storage ---
    chrome.storage.session.get('selectedText', (result) => {
        if (result.selectedText && result.selectedText.trim().length > 0) {
            selectedText = result.selectedText;
            actionsSection.style.display = 'flex';
            resultContainer.style.display = 'none';
        }
    });

    // --- Action buttons ---
    fixChatBtn.addEventListener('click', () => {
        if (!selectedText) return;
        currentFlow = 'fixChat';
        actionsSection.style.display = 'none';
        toneSelector.style.display = 'flex';
    });

    createTaskBtn.addEventListener('click', () => {
        if (!selectedText) return;
        currentFlow = 'createTask';
        actionsSection.style.display = 'none';
        taskTypeSelector.style.display = 'flex';
    });

    // --- Tone selection ---
    toneButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tone = e.target.closest('.tone-btn').dataset.tone;
            executeFixChat(tone);
        });
    });

    toneCancelBtn.addEventListener('click', () => {
        toneSelector.style.display = 'none';
        actionsSection.style.display = 'flex';
    });

    // --- Task type selection ---
    taskTypeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskType = e.target.closest('.task-type-btn').dataset.type;
            executeCreateTask(taskType);
        });
    });

    taskCancelBtn.addEventListener('click', () => {
        taskTypeSelector.style.display = 'none';
        actionsSection.style.display = 'flex';
    });

    // --- Copy button ---
    copyBtn.addEventListener('click', () => {
        const text = resultContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        }).catch((err) => {
            console.error('Clipboard error:', err);
        });
    });

    // --- Back button ---
    backBtn.addEventListener('click', () => {
        resultContainer.style.display = 'none';
        if (currentFlow === 'createTask') {
            taskTypeSelector.style.display = 'flex';
        } else if (currentFlow === 'fixChat') {
            toneSelector.style.display = 'flex';
        } else {
            actionsSection.style.display = 'flex';
        }
    });

    // --- Feature execution ---

    function executeFixChat(tone = 'professional') {
        if (!selectedText) return;
        try {
            const result = fixChat(selectedText, tone);
            displayResult(result);
            saveToStorage('fixChat', result);
            toneSelector.style.display = 'none';
            resultContainer.style.display = 'flex';
        } catch (error) {
            displayError('Failed to fix chat: ' + error.message);
            toneSelector.style.display = 'none';
        }
    }

    function executeCreateTask(taskType) {
        if (!selectedText) return;
        try {
            const result = createTask(selectedText, taskType);
            displayResult(result);
            saveToStorage('createTask', result);
            taskTypeSelector.style.display = 'none';
            resultContainer.style.display = 'flex';
        } catch (error) {
            displayError('Failed to create task: ' + error.message);
            taskTypeSelector.style.display = 'none';
        }
    }

    // --- Display helpers ---

    function displayResult(result) {
        resultContent.innerHTML = `<pre>${escapeHTML(result)}</pre>`;
        resultContainer.style.display = 'flex';
    }

    function displayError(message) {
        resultContent.innerHTML = `<p style="color: #e74c3c;">${escapeHTML(message)}</p>`;
        resultContainer.style.display = 'flex';
    }

});