// history.js - History page logic

const BACKEND_URL = 'https://easystant.vercel.app';

let currentTab = 'fixChat';

document.addEventListener('DOMContentLoaded', () => {
    const tabs        = document.querySelectorAll('.history-tab');
    const historyList = document.getElementById('history-list');
    const backBtn     = document.getElementById('back-to-panel');

    // --- Tab switching ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            loadHistory(currentTab);
        });
    });

    // --- Back button ---
    backBtn.addEventListener('click', () => {
        window.location.replace(chrome.runtime.getURL('public/panel.html'));
    });

    // --- Load initial tab ---
    loadHistory(currentTab);

    // --- Load history from Supabase via backend ---
    async function loadHistory(type) {
        historyList.innerHTML = '<div class="history-loading">Loading...</div>';

        try {
            const response = await fetch(`${BACKEND_URL}/api/history?type=${type}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            let data;
            try {
                data = await response.json();
            } catch (parseErr) {
                throw new Error('Server returned invalid response');
            }

            if (!response.ok) {
                throw new Error(data.error || `Server error ${response.status}`);
            }

            if (!data.history || data.history.length === 0) {
                historyList.innerHTML = `
                    <div class="history-empty">
                        <p>No history yet.</p>
                        <p>Use ${type === 'fixChat' ? 'Fix Chat' : 'Create Task'} to get started.</p>
                    </div>`;
                return;
            }

            historyList.innerHTML = data.history.map(entry => `
                <div class="history-item" data-id="${entry.id}" data-output="${escapeAttr(entry.output)}">
                    <div class="history-item-preview">${escapeHTML(entry.preview)}</div>
                    <div class="history-item-footer">
                        <span class="history-item-date">${formatDate(entry.created_at)}</span>
                        <div class="history-item-actions">
                            <button class="history-copy-btn" data-id="${entry.id}">Copy</button>
                            <button class="history-delete-btn" data-id="${entry.id}">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Copy buttons
            document.querySelectorAll('.history-copy-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const item = btn.closest('.history-item');
                    const output = item.dataset.output;
                    navigator.clipboard.writeText(output).then(() => {
                        btn.textContent = 'Copied!';
                        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                    });
                });
            });

            // Delete buttons
            document.querySelectorAll('.history-delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    btn.textContent = '...';
                    try {
                        const res = await fetch(`${BACKEND_URL}/api/history?id=${id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error('Delete failed');
                        btn.closest('.history-item').remove();
                        if (document.querySelectorAll('.history-item').length === 0) {
                            historyList.innerHTML = '<div class="history-empty"><p>No history yet.</p></div>';
                        }
                    } catch (err) {
                        btn.textContent = 'Error';
                        console.error('Delete error:', err);
                    }
                });
            });

        } catch (error) {
            historyList.innerHTML = `
                <div class="history-error">
                    <p>Failed to load history.</p>
                    <p style="font-size:11px; margin-top:4px;">${escapeHTML(error.message)}</p>
                </div>`;
            console.error('History load error:', error);
        }
    }
});

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}