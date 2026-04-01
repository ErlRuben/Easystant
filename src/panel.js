// Panel Script - Handles UI and user interactions

let selectedText = '';
let currentTaskType = 'general';

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
    const taskTypeSelector = document.getElementById('task-type-selector');
    const taskTypeButtons = document.querySelectorAll('.task-type-btn');
    const taskCancelBtn = document.getElementById('task-cancel');

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

    // Task type buttons
    taskTypeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskType = e.target.closest('.task-type-btn').dataset.type;
            executeCreateTaskWithType(taskType);
        });
    });

    // Task cancel button
    taskCancelBtn.addEventListener('click', () => {
        taskTypeSelector.style.display = 'none';
        actionsSection.style.display = 'flex';
    });

    function showToneSelector() {
        if (selectedText) {
            actionsSection.style.display = 'none';
            toneSelector.style.display = 'flex';
        }
    }

    function showTaskTypeSelector() {
        if (selectedText) {
            actionsSection.style.display = 'none';
            taskTypeSelector.style.display = 'flex';
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
            showTaskTypeSelector();
        }
    }

    function executeCreateTaskWithType(taskType) {
        if (selectedText) {
            try {
                currentTaskType = taskType;
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
        if (currentTaskType) {
            taskTypeSelector.style.display = 'flex';
        } else {
            toneSelector.style.display = 'flex';
        }
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

// Create Task Feature - Routes to type-specific handlers
function createTask(text, taskType = 'general') {
    try {
        let result = '';
        
        switch(taskType) {
            case 'support':
                result = createSupportTask(text);
                break;
            case 'bug':
                result = createBugTask(text);
                break;
            case 'general':
            default:
                result = createGeneralTask(text);
                break;
        }
        
        return result;
    } catch (error) {
        throw new Error('Failed to create task: ' + error.message);
    }
}

// Support Task Template
function createSupportTask(text) {
    const supportInfo = extractSupportInfo(text);
    const priority = suggestPriority(text);
    
    return `
👥 SUPPORT TASK

**Issue:**
${supportInfo.title}

**Category:**
${supportInfo.category}

**Customer/Issue Details:**
${supportInfo.details}

**Impact:**
${supportInfo.impact}

**Urgency Level:**
${supportInfo.urgency || 'Normal'}

**Required Actions:**
${supportInfo.actions}

**Priority:** ${priority}
**Status:** Open
**Created:** ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}


    `.trim();
}

// Bug Report Task Template
function createBugTask(text) {
    const bugInfo = extractTaskInfo(text);
    const priority = suggestPriority(text);
    const stepsToReproduce = extractStepsToReproduce(text, bugInfo.coreIssue);
    const expectedResult = extractExpectedResult(text, bugInfo.coreIssue);
    const actualResult = extractActualResult(text);
    const device = extractDevice(text);
    const version = extractVersion(text);
    
    return `
🐛 BUG REPORT TASK

**Issue Title:**
${bugInfo.title}

**Bug Description:**
${bugInfo.description}

**Affected Feature/System:**
${bugInfo.coreIssue}

**Issue Type:**
${bugInfo.issueType === 'regression' ? '[REGRESSION] Previously Working Feature' : '[BUG] Technical Issue'}

**Scope:**
${bugInfo.isWideScope ? 'Multiple items/vehicles affected - system-wide issue' : 'Single item/occurrence'}

**Steps to Reproduce:**
${stepsToReproduce}

**Expected Result:**
${expectedResult}

**Actual Result:**
${actualResult}

**Device/Platform:**
${device || 'Not specified'}

**Software Version:**
${version || 'Not specified'}

**Required Actions:**
* [HIGH PRIORITY] Investigate root cause
* Analyze differences from previous working version
* Implement fix or rollback
* Conduct regression testing
* Validate fix across all affected systems
* Communicate resolution to affected users

**Priority:** ${priority}
**Status:** Open - Awaiting Investigation
**Created:** ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}

**Additional Notes:**
${bugInfo.isWideScope ? 'This is a critical issue affecting multiple instances. Immediate investigation required.' : 'Investigate and implement fix.'}


    `.trim();
}

// General Task Template
function createGeneralTask(text) {
    const generalInfo = extractGeneralInfo(text);
    const priority = suggestPriority(text);
    const deadline = extractDeadline(text);
    
    return `
✓ TASK

**Task:**
${generalInfo.title}

**Details:**
${generalInfo.description}

**What's needed:**
${generalInfo.details}

**Deadline:**
${deadline || '(no deadline specified)'}

**Priority:** ${priority}
**Status:** Not Started
**Created:** ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}


    `.trim();
}

// Extract meaningful task title and description with AI inference
function extractTaskInfo(text) {
    text = text.trim();
    
    // Check if this actually looks like a bug report
    const lower = text.toLowerCase();
    const bugIndicators = ['can\'t', 'cannot', 'broken', 'doesn\'t', 'not working', 'doesn\'t work', 
                          'issue', 'bug', 'crashing', 'error', 'fail', 'unable', 'wrong', 'crash', 'freeze'];
    const isBugLike = bugIndicators.some(indicator => lower.includes(indicator));
    
    // If this doesn't look like a bug report at all, use a fallback approach
    if (!isBugLike) {
        // This is probably a general/support task being converted to bug - be more flexible
        const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
        const description = sentences.slice(0, 2).join(' ').trim();
        const title = sentences.length > 0 ? sentences[0].substring(0, 75) : text.substring(0, 75);
        
        return {
            title: title.charAt(0).toUpperCase() + title.slice(1),
            description: description || text.substring(0, 220),
            coreIssue: 'Task',
            issueType: 'general_as_bug',
            isWideScope: false
        };
    }
    
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
        const sl = s.toLowerCase();
        return (sl.includes('can\'t') || sl.includes('cannot') || sl.includes('broken') || 
                sl.includes('doesn\'t') || sl.includes('not working') || sl.includes('doesn\'t work') ||
                sl.includes('nothing shows') || sl.includes('doesn\'t apply') || sl.includes('issue') ||
                sl.includes('bug') || sl.includes('crashing') || sl.includes('error') ||
                sl.includes('fail') || sl.includes('unable') || sl.includes('wrong')) &&
               !sl.startsWith('why') && !sl.startsWith('did') && !sl.startsWith('maybe');
    });
    
    let coreIssue = '';
    
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
    
    // Handle general tasks converted to bug format
    if (issueType === 'general_as_bug') {
        title = `[TASK] ${coreIssue}`;
        if (title.length > 75) {
            title = title.substring(0, 72) + '...';
        }
        return title;
    }
    
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
    
    // Handle general tasks converted to bug format
    if (issueType === 'general_as_bug') {
        return fullText.substring(0, 300);
    }
    
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

// Task Type Specific Extractors

// Extract deadline from text
function extractDeadline(text) {
    const lower = text.toLowerCase();
    
    // Date patterns
    const datePatterns = [
        /(?:by|due|deadline|finish|complete|done)\s+(?:by\s+)?(?:tomorrow|today|tonight|this week|next week|end of week|end of month|next month)/i,
        /(?:by|due|before|finish|complete)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
        /(?:deadline|due date|duedate)[\s:]*(.+?)(?:\.|,|;|$)/i
    ];
    
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1] || match[0].replace(/(?:by|due|before|deadline|duedate|finish|complete)\s*/i, '');
        }
    }
    
    return '';
}

// Extract Support Task Info - Intelligent parsing for customer support issues
function extractSupportInfo(text) {
    const lower = text.toLowerCase();
    
    // Step 1: Filter out dialogue filler
    const dialogueFiller = /^(yeah|yep|true|ok|okay|no|nah|wait|what|lol|uh|um|like|so|but|and|well)/i;
    const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 5 && !dialogueFiller.test(s));
    
    // Step 2: Extract the broken feature
    const featureKeywords = {
        'decal': 'Decal System',
        'customization': 'Customization System',
        'texture': 'Texture System',
        'save': 'Save/Persistence System',
        'load': 'Loading System',
        'render': 'Rendering System',
        'upload': 'Upload System',
        'download': 'Download System',
        'payment': 'Payment System',
        'login': 'Authentication System',
        'search': 'Search System',
        'sync': 'Sync System'
    };
    
    let brokenFeature = 'Feature';
    for (const [keyword, feature] of Object.entries(featureKeywords)) {
        if (lower.includes(keyword)) {
            brokenFeature = feature;
            break;
        }
    }
    
    // Step 3: Detect if it's a regression (worked before, broken now)
    const regressionKeywords = ['worked before', 'worked last', 'used to work', 'previously', 'literally', 'yes', 'it was working', 'did work', 'was working'];
    const isRegression = regressionKeywords.some(keyword => lower.includes(keyword));
    
    // Step 4: Extract meaningful title - prioritize problem statements over dialogue
    let title = isRegression 
        ? `${brokenFeature} not working - Regression`
        : `${brokenFeature} not working`;
    
    // Try to extract more context from problem statement sentences
    const problemStatements = sentences.filter(s => {
        const sl = s.toLowerCase();
        return (sl.includes('cannot') || sl.includes('can\'t') || sl.includes('doesn\'t') || 
               sl.includes('not working') || sl.includes('broken'));
    });
    
    // If we have problem statements, look for one that also mentions the feature
    let selectedStatement = null;
    
    if (problemStatements.length > 0) {
        // First, look for problem statement that mentions the feature
        selectedStatement = problemStatements.find(s => s.toLowerCase().includes(brokenFeature.toLowerCase().split(' ')[0]));
        
        // If not found, use the first one
        if (!selectedStatement) {
            selectedStatement = problemStatements[0];
        }
    }
    
    if (selectedStatement) {
        let cleanedSentence = selectedStatement
            .replace(/^(yeah|yep|true|ok|okay|no|nah|wait|what|lol|well|um|uh|so|but|and|like|bro|dude|hey|man|seriously|i swear|why|can\'t\s+i|can't\s+i|does\s+(?:not|n\'t)|how\s+come)\s+/i, '')
            .trim()
            .replace(/\?+$/, ''); // Remove trailing question marks
        
        // For common patterns, extract just the meaningful part
        if (cleanedSentence.includes('place') && cleanedSentence.includes('decal')) {
            cleanedSentence = 'Cannot place decals';
        } else if (cleanedSentence.includes('apply') && cleanedSentence.includes('decal')) {
            cleanedSentence = 'Cannot apply decals';
        }
        
        if (cleanedSentence.length > 10 && cleanedSentence.length < 90) {
            title = cleanedSentence.charAt(0).toUpperCase() + cleanedSentence.slice(1);
        }
    }
    
    // Step 5: Detect impact (single vs multiple vs widespread)
    const multipleIndicators = ['tried a different', 'all ', 'not just', 'whole ', 'everyone', 'multiple', 'both', 'saw someone else'];
    const hasMultipleImpact = multipleIndicators.some(indicator => lower.includes(indicator));
    
    let impact = 'Single user/occurrence';
    if (lower.includes('multiple') || lower.includes('all vehicles') || lower.includes('all trucks')) {
        impact = 'Multiple items/users affected - System-wide issue';
    } else if (lower.includes('not just one') || lower.includes('tried a different') || lower.includes('saw someone else') || lower.includes('not just me')) {
        impact = 'Multiple users/items affected';
    } else if (lower.includes('everyone') || lower.includes('widespread') || lower.includes('global')) {
        impact = 'Widespread impact - Critical scope';
    }
    
    // Step 6: Detect category
    const categoryMap = {
        'Feature Issue': ['feature', 'system', 'decal', 'customization', 'texture'],
        'Technical Error': ['error', 'bug', 'broken', 'crash', 'not working'],
        'Regression': ['regression', 'worked before', 'stopped working'],
        'Data issue': ['data', 'save', 'load', 'sync'],
        'Performance Issue': ['slow', 'lag', 'freeze', 'delay'],
        'General Support': ['issue', 'problem', 'help']
    };
    
    let category = 'Technical Error';
    if (isRegression) {
        category = 'Regression - Feature Broken';
    } else {
        for (const [cat, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(keyword => lower.includes(keyword))) {
                category = cat;
                break;
            }
        }
    }
    
    // Step 7: Check urgency
    let urgency = 'Normal';
    if (lower.includes('broken') || lower.includes('not working') || isRegression) {
        urgency = 'High';
    }
    if (lower.includes('urgent') || lower.includes('critical') || lower.includes('immediately') || lower.includes('asap')) {
        urgency = 'Critical/Urgent';
    }
    
    // Step 8: Extract required actions
    let actions = '* Verify issue reproduction\n* Investigate root cause\n* Implement fix or workaround\n* Test resolution\n* Update customer';
    
    if (isRegression) {
        actions = '* [HIGH PRIORITY] Analyze recent changes\n* Identify what broke in last update\n* Implement rollback or fix\n* Extensive regression testing\n* Deploy fix immediately';
    }
    
    if (hasMultipleImpact || impact.includes('Multiple') || impact.includes('Widespread')) {
        actions = '* [CRITICAL] Escalate immediately\n' + actions;
    }
    
    const details = sentences.slice(0, 3).join(' ').trim();
    const detailsText = details.length > 180 ? details.substring(0, 177) + '...' : (details || text);
    
    return { 
        title, 
        category, 
        details: detailsText, 
        impact, 
        actions, 
        urgency,
        isRegression,
        brokenFeature
    };
}

// Extract General Task Info - Intelligent flexible parsing for any task type
function extractGeneralInfo(text) {
    const lower = text.toLowerCase();
    
    // Step 1: Filter out dialogue filler
    const dialogueFiller = /^(yeah|yep|true|ok|okay|no|nah|wait|what|lol|uh|um|like|so|but|and|well)/i;
    const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 5 && !dialogueFiller.test(s));
    
    // Step 2: Detect if content is bug/issue-related
    const bugIndicators = ['can\'t', 'cannot', 'doesn\'t', 'broken', 'not working', 'doesn\'t work', 'issue', 'bug', 'crash', 'error', 'fail', 'unable'];
    const isBugRelated = bugIndicators.some(indicator => lower.includes(indicator));
    
    // Step 3: Smart title generation
    let title = 'Task';
    
    if (isBugRelated) {
        // For bug-related content, extract a concise problem statement
        const problemSentences = sentences.filter(s => {
            const sl = s.toLowerCase();
            return bugIndicators.some(ind => sl.includes(ind)) && !sl.startsWith('why') && !sl.startsWith('did');
        });
        
        if (problemSentences.length > 0) {
            const mainProblem = problemSentences[0];
            const cleaned = mainProblem.replace(/^(yeah|yep|true|ok|okay|no|nah|wait|what|lol|well|um|uh|so|but|and|like|why|how come)\s+/i, '').trim();
            
            // Capitalize and clean up
            title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            if (title.length > 85) {
                title = title.substring(0, 82) + '...';
            }
        }
    } else {
        // For non-bug content, try to extract from first meaningful sentence
        if (sentences.length > 0) {
            const firstSentence = sentences[0].trim();
            const cleanedSentence = firstSentence.replace(/^(yeah|yep|true|ok|okay|no|nah|wait|what|lol|well|um|uh|so|but|and|like)\s+/i, '').trim();
            title = cleanedSentence.length > 85 ? cleanedSentence.substring(0, 82) + '...' : (cleanedSentence || firstSentence);
        }
    }
    
    // Step 4: Extract "details" field intelligently
    let details = 'Complete as described';
    
    // Look for explicit instructions first
    const detailPatterns = [
        /(?:need|required|must|should|have to)\s+([^.!?]+?)(?:\.|,|;|and|or|$)/i,
        /(?:to|in order to)\s+([^.!?]+?)(?:\.|,|;|and|or|$)/i
    ];
    
    for (const pattern of detailPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].length > 5) {
            details = match[1].trim();
            if (details.length > 150) {
                details = details.substring(0, 147) + '...';
            }
            break;
        }
    }
    
    // For bug-related content, extract what was expected vs actual
    if (details === 'Complete as described' && isBugRelated) {
        const expectedPatterns = [
            /(?:should|should be|supposed to|expect|expected|want|need)\s+([^.!?]+?)(?:\.|,|;|$)/i,
            /(?:should\s+)?(?:it|they|feature|system)\s+(?:work|function|display|show|apply)\s+([^.!?]+?)(?:\.|,|;|$)/i
        ];
        
        for (const pattern of expectedPatterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[1].length > 5) {
                details = 'Fix to: ' + match[1].trim();
                if (details.length > 150) {
                    details = details.substring(0, 147) + '...';
                }
                break;
            }
        }
    }
    
    // Fallback: use another sentence if pattern didn't match
    if (details === 'Complete as described' && sentences.length > 1) {
        const meaningfulSent = sentences.find(s => {
            const sl = s.toLowerCase();
            return sl.includes('need') || sl.includes('required') || sl.includes('must') || 
                   sl.includes('should') || sl.includes('want') || sl.includes('make') ||
                   sl.includes('work') || sl.includes('apply') || sl.includes('display');
        });
        
        if (meaningfulSent) {
            const cleaned = meaningfulSent.replace(/^(yeah|yep|true|ok|okay|no|nah|wait|what|lol|well|um|uh|so|but|and|like|why|how come)\s+/i, '').trim();
            details = cleaned;
        }
    }
    
    // Step 5: Extract description (use more context for bug-related issues)
    const descriptionSentenceCount = isBugRelated ? 3 : 2;
    const description = sentences.slice(0, descriptionSentenceCount).join(' ').trim();
    const descriptionText = description.length > 220 ? description.substring(0, 217) + '...' : (description || text.substring(0, 217));
    
    return { title, description: descriptionText, details, isBugRelated };
}
