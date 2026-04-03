// createTask.js - Create Task feature: calls Vercel backend for AI-powered task generation

var BACKEND_URL = 'https://easystant.vercel.app'; // ← replace with your Vercel URL after deploy

/**
 * Create Task: Generate structured task using Claude AI via backend
 * @param {string} text - The selected text
 * @param {string} taskType - 'bug' | 'support' | 'general'
 * @returns {Promise<string>} - Formatted task output
 */
async function createTask(text, taskType = 'general') {
    try {
        const response = await fetch(`${BACKEND_URL}/api/create-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, taskType })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        // Format the AI-parsed result into the appropriate template
        return formatTask(data.result, taskType);

    } catch (error) {
        // Fallback to local extraction if backend is unavailable
        console.warn('Backend unavailable, using local fallback:', error.message);
        return createTaskLocally(text, taskType);
    }
}

/**
 * Format AI-parsed task data into display template
 */
function formatTask(parsed, taskType) {
    const now = getCurrentTimestamp();

    switch (taskType) {
        case 'bug':
            return `
🐛 BUG REPORT TASK

**Issue Title:**
${parsed.title}

**Bug Description:**
${parsed.description}

**Affected Feature/System:**
${parsed.coreIssue}

**Issue Type:**
${parsed.issueType === 'regression' ? '[REGRESSION] Previously Working Feature' : '[BUG] Technical Issue'}

**Steps to Reproduce:**
${parsed.stepsToReproduce}

**Expected Result:**
${parsed.expectedResult}

**Actual Result:**
${parsed.actualResult}

**Priority:** ${parsed.priority}
**Status:** Open - Awaiting Investigation
**Created:** ${now.date} ${now.time}
            `.trim();

        case 'support':
            return `
👥 SUPPORT TASK

**Issue:**
${parsed.title}

**Category:**
${parsed.category}

**Customer/Issue Details:**
${parsed.details}

**Impact:**
${parsed.impact}

**Urgency Level:**
${parsed.urgency}

**Required Actions:**
${parsed.actions}

**Priority:** ${parsed.priority}
**Status:** Open
**Created:** ${now.date} ${now.time}
            `.trim();

        case 'general':
        default:
            return `
✓ TASK

**Task:**
${parsed.title}

**Details:**
${parsed.description}

**What's needed:**
${parsed.details}

**Deadline:**
${parsed.deadline || '(no deadline specified)'}

**Priority:** ${parsed.priority}
**Status:** Not Started
**Created:** ${now.date} ${now.time}
            `.trim();
    }
}

/**
 * Local fallback when backend is unavailable
 */
function createTaskLocally(text, taskType) {
    try {
        switch (taskType) {
            case 'support': return createSupportTask(text);
            case 'bug':     return createBugTask(text);
            case 'general':
            default:        return createGeneralTask(text);
        }
    } catch (error) {
        throw new Error('Failed to create task: ' + error.message);
    }
}

// --- Local fallback task builders (regex-based) ---

function createBugTask(text) {
    const bugInfo          = extractTaskInfo(text);
    const priority         = suggestPriority(text);
    const stepsToReproduce = extractStepsToReproduce(text, bugInfo.coreIssue);
    const expectedResult   = extractExpectedResult(text, bugInfo.coreIssue);
    const actualResult     = extractActualResult(text);
    const device           = extractDevice(text);
    const version          = extractVersion(text);
    const { date, time }   = getCurrentTimestamp();

    return `
🐛 BUG REPORT TASK (offline mode)

**Issue Title:**
${bugInfo.title}

**Bug Description:**
${bugInfo.description}

**Affected Feature/System:**
${bugInfo.coreIssue}

**Issue Type:**
${bugInfo.issueType === 'regression' ? '[REGRESSION] Previously Working Feature' : '[BUG] Technical Issue'}

**Scope:**
${bugInfo.isWideScope ? 'Multiple items affected - system-wide issue' : 'Single item/occurrence'}

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

**Priority:** ${priority}
**Status:** Open - Awaiting Investigation
**Created:** ${date} ${time}
    `.trim();
}

function createSupportTask(text) {
    const supportInfo    = extractSupportInfo(text);
    const priority       = suggestPriority(text);
    const { date, time } = getCurrentTimestamp();

    return `
👥 SUPPORT TASK (offline mode)

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
**Created:** ${date} ${time}
    `.trim();
}

function createGeneralTask(text) {
    const generalInfo    = extractGeneralInfo(text);
    const priority       = suggestPriority(text);
    const deadline       = extractDeadline(text);
    const { date, time } = getCurrentTimestamp();

    return `
✓ TASK (offline mode)

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
**Created:** ${date} ${time}
    `.trim();
}