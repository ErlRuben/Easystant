// Panel Script - Handles UI and user interactions

let selectedText = '';

document.addEventListener('DOMContentLoaded', async () => {
    const fixChatBtn = document.getElementById('fix-chat-btn');
    const createTaskBtn = document.getElementById('create-task-btn');
    const copyBtn = document.getElementById('copy-btn');
    const backBtn = document.getElementById('back-btn');
    const resultContainer = document.getElementById('result-container');
    const resultContent = document.getElementById('result-content');
    const actionsSection = document.getElementById('actions');
    const toneSelector = document.getElementById('tone-selector');
    const toneButtons = document.querySelectorAll('.tone-btn');
    const toneCancelBtn = document.getElementById('tone-cancel');

    // Check for selected text when panel opens
    chrome.storage.session.get('selectedText', (result) => {
        if (result.selectedText && result.selectedText.trim().length > 0) {
            selectedText = result.selectedText;
            actionsSection.style.display = 'flex';
            resultContainer.style.display = 'none';
            console.log('Selected text found:', selectedText.substring(0, 50) + '...');
        }
    });

    // Fix Chat Button
    fixChatBtn.addEventListener('click', showToneSelector);

    // Create Task Button
    createTaskBtn.addEventListener('click', executeCreateTask);

    // Tone buttons
    toneButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tone = e.target.closest('.tone-btn').dataset.tone;
            executeFixChat(tone);
        });
    });

    // Tone cancel button
    toneCancelBtn.addEventListener('click', () => {
        toneSelector.style.display = 'none';
        actionsSection.style.display = 'flex';
    });

    function showToneSelector() {
        if (selectedText) {
            actionsSection.style.display = 'none';
            toneSelector.style.display = 'flex';
        }
    }

    function executeFixChat(tone = 'professional') {
        if (selectedText) {
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
    }

    function executeCreateTask() {
        if (selectedText) {
            try {
                const result = createTask(selectedText);
                displayResult(result);
                saveToStorage('createTask', result);
            } catch (error) {
                displayError('Failed to create task: ' + error.message);
            }
        }
    }

    // Copy Button
    copyBtn.addEventListener('click', () => {
        const text = resultContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
            }, 2000);
        });
    });

    // Back Button
    backBtn.addEventListener('click', () => {
        resultContainer.style.display = 'none';
        toneSelector.style.display = 'flex';
    });

    function displayResult(result) {
        resultContent.innerHTML = `<pre>${escapeHTML(result)}</pre>`;
        resultContainer.style.display = 'flex';
    }

    function displayError(error) {
        resultContent.innerHTML = `<p style="color: #e74c3c;">${escapeHTML(error)}</p>`;
        resultContainer.style.display = 'flex';
    }

    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

// Fix Chat Feature
function fixChat(text, tone = 'professional') {
    try {
        const enhanced = enhanceText(text, tone);
        return `
📝 FIXED CHAT

Tone: ${tone.toUpperCase()}

Original:
"${text}"

Improved:
"${enhanced}"
        `.trim();
    } catch (error) {
        throw new Error('Failed to fix chat: ' + error.message);
    }
}

// Create Task Feature
function createTask(text) {
    try {
        const { title, description, coreIssue, issueType, isWideScope } = extractTaskInfo(text);
        const priority = suggestPriority(text);
        const version = extractVersion(text);
        const device = extractDevice(text);
        const stepsToReproduce = extractStepsToReproduce(text, coreIssue);
        const expectedResult = extractExpectedResult(text, coreIssue);
        const actualResult = extractActualResult(text);
        
        return `
📋 TASK

**Title:**
${title}

**Description:**
${description}

**Steps to Reproduce:**
${stepsToReproduce}

**Expected Result:**
${expectedResult}

**Actual Result:**
${actualResult}

**Scope / Impact:**
${isWideScope ? '* Affects entire system / all variations of the feature' : '* Issue may be isolated to specific conditions'}
* Feature is completely non-functional in the affected area

**Priority:** ${priority}
**Version:** ${version || 'Unknown (not mentioned)'}
**Device:** ${device || '(not mentioned)'}
**Created:** ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}


        `.trim();
    } catch (error) {
        throw new Error('Failed to create task: ' + error.message);
    }
}

// Extract meaningful task title and description with AI inference
function extractTaskInfo(text) {
    text = text.trim();
    
    // Expanded feature keyword mapping
    const featureKeywords = {
        decal: 'Decal System',
        texture: 'Texture System',
        customize: 'Customization System',
        customization: 'Customization System',
        save: 'Save System',
        load: 'Loading System',
        render: 'Rendering System',
        crash: 'Stability',
        freeze: 'Performance',
        lag: 'Performance',
        fps: 'Performance',
        login: 'Authentication',
        auth: 'Authentication',
        payment: 'Payment System',
        upload: 'Upload System',
        download: 'Download System',
        sound: 'Audio System',
        audio: 'Audio System',
        music: 'Audio System',
        video: 'Video System',
        image: 'Image System',
        camera: 'Camera System',
        location: 'Location Service',
        gps: 'GPS System',
        notification: 'Notification System',
        message: 'Messaging System',
        chat: 'Chat System',
        search: 'Search System',
        filter: 'Filter System',
        sort: 'Sorting System',
        export: 'Export System',
        import: 'Import System',
        sync: 'Sync System',
        backup: 'Backup System',
        database: 'Database System',
        api: 'API System',
        network: 'Network System',
        wifi: 'WiFi Connection',
        bluetooth: 'Bluetooth Connection',
        server: 'Server',
        cloud: 'Cloud Service'
    };

    // Split into sentences
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
    
    // Find problem statements
    const problemSentences = sentences.filter(s => {
        const lower = s.toLowerCase();
        return (lower.includes('can\'t') || lower.includes('cannot') || lower.includes('broken') || 
                lower.includes('doesn\'t') || lower.includes('not working') || lower.includes('doesn\'t work') ||
                lower.includes('nothing shows') || lower.includes('doesn\'t apply') || lower.includes('issue') ||
                lower.includes('bug') || lower.includes('crashing') || lower.includes('error') ||
                lower.includes('fail') || lower.includes('unable') || lower.includes('wrong')) &&
               !lower.startsWith('why') && !lower.startsWith('did') && !lower.startsWith('maybe');
    });
    
    let coreIssue = '';
    const lower = text.toLowerCase();
    
    // Step 1: Try to match exact feature keywords
    for (const [keyword, featureName] of Object.entries(featureKeywords)) {
        if (lower.includes(keyword)) {
            coreIssue = featureName;
            break;
        }
    }
    
    // Step 2: If no keyword matched, extract noun phrase from problem sentences
    if (!coreIssue && problemSentences.length > 0) {
        const mainSentence = problemSentences[0];
        
        // Try to extract the actual object/feature being discussed
        // Pattern: "can't/cannot/doesn't... [article] [adjective] [NOUN/NOUN PHRASE]"
        const patterns = [
            /(?:can't|cannot|doesn't|doesn't work|not working|issue with|problem with|broken)\s+(?:the\s+)?(?:my\s+)?(?:[a-z]+\s+)*([a-z]+(?:\s+[a-z]+)?)/i,
            /when\s+(?:i\s+)?([a-z]+(?:\s+[a-z]+)?)\s+(?:is|are|it)\s+(?:not|broken|fails|crashes)/i,
            /the\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:is|doesn't|can't|won't)\s+(?:work|function|respond)/i,
            /my\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:is|doesn't|can't)\s+(?:work|function)/i
        ];
        
        for (const pattern of patterns) {
            const match = mainSentence.match(pattern);
            if (match && match[1]) {
                let extracted = match[1].trim();
                // Filter out common words that aren't features
                if (!['is', 'a', 'the', 'and', 'or', 'not', 'but'].includes(extracted.toLowerCase())) {
                    coreIssue = capitalizeWords(extracted);
                    break;
                }
            }
        }
    }
    
    // Step 3: If still no match, extract any noun-like words from the problem context
    if (!coreIssue && problemSentences.length > 0) {
        // Extract capitalized words or words that look like feature names
        const words = problemSentences[0].match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/);
        if (words && words.length > 0) {
            coreIssue = words[0];
        }
    }
    
    // Step 4: Last resort - look for any significant words in first problem sentence
    if (!coreIssue && problemSentences.length > 0) {
        const wordList = problemSentences[0]
            .replace(/(?:can't|cannot|doesn't|doesn't work|not working|issue|bug|broken|error)/gi, '')
            .split(/\s+/)
            .filter(w => w.length > 4 && !['about', 'which', 'where', 'there', 'these'].includes(w.toLowerCase()));
        
        if (wordList.length > 0) {
            coreIssue = capitalizeWords(wordList[0]);
        }
    }
    
    // Fallback: Use a placeholder that indicates data was found but undefined
    if (!coreIssue) {
        coreIssue = 'Reported Issue';
    }
    
    // Determine if it's a regression
    const isRegression = text.toLowerCase().includes('work before') || 
                        text.toLowerCase().includes('worked before') ||
                        text.toLowerCase().includes('worked last') ||
                        text.toLowerCase().includes('previously') ||
                        text.toLowerCase().includes('used to work') ||
                        text.toLowerCase().includes('it was working') ||
                        text.toLowerCase().includes('used to');
    
    const issueType = isRegression ? 'regression' : 'bug';
    
    // Extract scope
    const isWideScope = text.toLowerCase().includes('all ') || 
                       text.toLowerCase().includes('entire ') ||
                       text.toLowerCase().includes('whole ') ||
                       text.toLowerCase().includes('every ') ||
                       text.toLowerCase().includes('not just') ||
                       text.toLowerCase().includes('doesn\'t matter') ||
                       text.toLowerCase().includes('all vehicles') ||
                       text.toLowerCase().includes('all trucks');
    
    // Extract troubleshooting evidence
    const troubleshooted = text.toLowerCase().includes('restart') || 
                          text.toLowerCase().includes('reinstall') ||
                          text.toLowerCase().includes('restarted') ||
                          text.toLowerCase().includes('reinstalled') ||
                          text.toLowerCase().includes('tried');
    
    // Generate title and description
    const title = generateSmartTitle(coreIssue, issueType);
    const description = generateComprehensiveDescription(coreIssue, issueType, isWideScope, troubleshooted, text);
    
    return { title, description, coreIssue, issueType, isWideScope };
}

// Generate smart professional title
function generateSmartTitle(coreIssue, issueType) {
    let title = '';
    
    // Action verb mapping for better titles
    const actionMap = {
        'decal': 'Cannot Apply Decals',
        'customization': 'Cannot Save Customizations',
        'save': 'Cannot Save Data',
        'load': 'Cannot Load Data',
        'upload': 'Cannot Upload Files',
        'download': 'Cannot Download Files',
        'payment': 'Cannot Process Payment',
        'login': 'Cannot Authenticate User',
        'search': 'Search Not Working',
        'video': 'Cannot Play Video',
        'audio': 'Cannot Play Audio'
    };
    
    // Find matching action verb
    let actionVerb = 'Not Functioning';
    const issueLower = coreIssue.toLowerCase();
    for (const [keyword, action] of Object.entries(actionMap)) {
        if (issueLower.includes(keyword)) {
            actionVerb = action;
            break;
        }
    }
    
    if (issueType === 'regression') {
        title = `[REGRESSION] ${coreIssue} – ${actionVerb} After Update`;
    } else {
        title = `[BUG] ${coreIssue} – ${actionVerb}`;
    }
    

    if (title.length > 75) {
        title = title.substring(0, 72) + '...';
    }
    
    return title;
}

// Generate comprehensive AI-inferred description
function generateComprehensiveDescription(coreIssue, issueType, isWideScope, troubleshooted, fullText) {
    const lower = fullText.toLowerCase();
    
    // Identify affected system
    const featureKeywords = {
        decal: 'decal customization',
        texture: 'texture application',
        customize: 'customization system',
        save: 'save/persistence',
        load: 'loading',
        render: 'rendering',
        apply: 'application',
        select: 'selection',
        show: 'display/rendering',
        crash: 'stability',
        freeze: 'performance',
        lag: 'network/latency',
        fps: 'performance'
    };
    
    let affectedSystem = 'feature';
    for (const [keyword, system] of Object.entries(featureKeywords)) {
        if (lower.includes(keyword)) {
            affectedSystem = system;
            break;
        }
    }
    
    let description = '';
    
    // Build description based on evidence
    if (issueType === 'regression') {
        description = `The ${affectedSystem} was previously functional but is now broken. `;
        
        if (isWideScope) {
            description += `This affects the entire system (not isolated to one item). `;
        }
        
        description += `User confirmed this worked in a prior version and stopped working after a recent update. `;
        
        if (troubleshooted) {
            description += `Standard troubleshooting (restart, reinstall) has been attempted without resolving the issue. `;
        }
        
        description += `Requires investigation to identify what changed in the last update and rollback or fix the regression.`;
    } else {
        description = `The ${affectedSystem} is not functioning as expected. When accessed, the feature does not respond or apply changes. `;
        
        if (isWideScope) {
            description += `This issue is pervasive across the entire system rather than isolated. `;
        }
        
        description += `No error messages or warnings are being displayed to guide the user. `;
        
        if (troubleshooted) {
            description += `Common troubleshooting steps have been performed without resolution. `;
        }
        
        description += `Root cause analysis needed to determine if this is a missing feature, data issue, or technical bug.`;
    }
    
    return description;
}

// Helper function to capitalize words
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Extract software version from text
function extractVersion(text) {
    // Look for version patterns: v1.0, version 1.0, 1.0.0, build 123, etc.
    const versionPatterns = [
        /version\s+(\d+\.\d+(?:\.\d+)?)/i,
        /v(\d+\.\d+(?:\.\d+)?)/i,
        /release\s+(\d+\.\d+(?:\.\d+)?)/i,
        /build\s+(\d+)/i,
        /(\d+\.\d+(?:\.\d+)?)\s+(?:update|patch|release)/i,
        /update\s+(\d+\.\d+(?:\.\d+)?)/i
    ];
    
    for (const pattern of versionPatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return '';
}

// Extract device type from text
function extractDevice(text) {
    const lower = text.toLowerCase();
    
    // Check for mobile platforms
    if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios') || lower.includes('apple')) {
        return 'iOS';
    }
    
    if (lower.includes('android') || lower.includes('samsung') || lower.includes('pixel') || lower.includes('mobile')) {
        return 'Android';
    }
    
    if (lower.includes('windows') || lower.includes('pc') || lower.includes('desktop') || lower.includes('computer')) {
        return 'Windows';
    }
    
    if (lower.includes('mac') || lower.includes('osx') || lower.includes('macos')) {
        return 'macOS';
    }
    
    if (lower.includes('linux')) {
        return 'Linux';
    }
    
    if (lower.includes('playstation') || lower.includes('ps4') || lower.includes('ps5') || lower.includes('console')) {
        return 'Console';
    }
    
    return '';
}

// Extract steps to reproduce from context
function extractStepsToReproduce(text, coreIssue) {
    const lower = text.toLowerCase();
    
    // Common step patterns for different features
    const stepPatterns = {
        decal: ['1. Open/access the game', '2. Navigate to truck customization', '3. Select the decals option', '4. Attempt to apply any decal'],
        customization: ['1. Access customization menu', '2. Select the feature', '3. Try to apply changes', '4. Attempt to save/confirm'],
        save: ['1. Create or modify content', '2. Attempt to save', '3. Check if saved data persists', '4. Reload/relaunch to verify'],
        upload: ['1. Select file to upload', '2. Initiate upload process', '3. Wait for completion', '4. Verify upload status'],
        music: ['1. Access audio settings', '2. Select audio option', '3. Play audio', '4. Verify sound output'],
        video: ['1. Open media player', '2. Load video file', '3. Press play', '4. Verify playback'],
        payment: ['1. Add item to cart', '2. Proceed to checkout', '3. Enter payment details', '4. Complete transaction'],
        login: ['1. Open login screen', '2. Enter credentials', '3. Submit login', '4. Verify authentication'],
        search: ['1. Open search feature', '2. Enter search term', '3. Execute search', '4. Review results']
    };
    
    // Try to match feature to step pattern
    const featureLower = coreIssue.toLowerCase();
    for (const [keyword, steps] of Object.entries(stepPatterns)) {
        if (featureLower.includes(keyword)) {
            return steps.join('\n');
        }
    }
    
    // Generic fallback
    return `1. Access the affected feature
2. Perform the intended action
3. Observe the issue
4. Note any error messages or lack thereof`;
}

// Extract expected result from context
function extractExpectedResult(text, coreIssue) {
    const lower = text.toLowerCase();
    
    const resultPatterns = {
        decal: 'Selected decal is applied and visible on the truck',
        customization: 'Customization changes are applied and visible',
        save: 'Data is saved and persists after reload',
        upload: 'File is successfully uploaded and confirmed',
        music: 'Audio plays clearly without interruption',
        video: 'Video plays smoothly from start to finish',
        payment: 'Transaction is processed and order is confirmed',
        login: 'User is authenticated and granted access',
        search: 'Relevant search results are displayed'
    };
    
    // Try to match feature to expected result
    const featureLower = coreIssue.toLowerCase();
    for (const [keyword, result] of Object.entries(resultPatterns)) {
        if (featureLower.includes(keyword)) {
            return result;
        }
    }
    
    // Generic fallback
    return `Feature functions as designed and produces expected output`;
}

// Extract actual result from text
function extractActualResult(text) {
    const lower = text.toLowerCase();
    
    let result = '';
    
    // Check for what actually happens
    if (lower.includes('nothing shows') || lower.includes('nothing happens')) {
        result = 'Nothing occurs; no visual feedback';
    } else if (lower.includes('no error') || lower.includes('no feedback') || lower.includes('no message')) {
        result = 'Feature silently fails with no error message or user feedback';
    } else if (lower.includes('doesn\'t apply') || lower.includes('not applied')) {
        result = 'Changes are not applied or reflected in the system';
    } else if (lower.includes('crash') || lower.includes('freeze')) {
        result = 'Application crashes or becomes unresponsive';
    } else if (lower.includes('blank') || lower.includes('empty')) {
        result = 'Feature displays blank or empty state';
    } else {
        result = 'Feature does not function as expected; issue manifests without clear error reporting';
    }
    
    return result;
}

function enhanceText(text, tone) {
    let improved = text.trim();
    
    switch (tone) {
        case 'casual':
            improved = improved.replace(/\.$/, '!');
            break;
        case 'professional':
            improved = improved.charAt(0).toUpperCase() + improved.slice(1).toLowerCase();
            break;
        case 'simple':
            improved = improved.toLowerCase();
            break;
        default:
            improved = improved.charAt(0).toUpperCase() + improved.slice(1).toLowerCase();
    }
    
    return improved;
}

function suggestPriority(text) {
    const urgent = /urgent|asap|critical|immediately|emergency|broken|crash|error|bug/i;
    const important = /important|essential|must|should|required|help|need|issue|problem|doesn't work|can't/i;
    const emotional = /[!?]{2,}|omg|seriously|fuck/i; // Multiple punctuation or strong language
    
    if (urgent.test(text) || emotional.test(text)) {
        return 'HIGH';
    } else if (important.test(text)) {
        return 'MEDIUM';
    }
    return 'NORMAL';
}

// Chrome Storage
function saveToStorage(type, data) {
    try {
        const timestamp = new Date().toISOString();
        const item = {
            type,
            data,
            timestamp
        };

        chrome.storage.local.get('history', (result) => {
            const history = result.history || [];
            history.push(item);
            
            if (history.length > 50) {
                history.shift();
            }
            
            chrome.storage.local.set({ history }, () => {
                console.log(`Saved ${type} to storage`);
            });
        });
    } catch (error) {
        console.error('Storage error:', error);
    }
}
