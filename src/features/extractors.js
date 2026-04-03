// extractors.js - Text extraction helpers for task generation
// Filler words to strip from sentence beginnings
const DIALOGUE_FILLER = /^(yeah|yep|true|ok|okay|no|nah|wait|what|lol|uh|um|like|so|but|and|well)\s+/i;

/**
 * Split text into clean sentences, filtering out filler-only sentences
 * @param {string} text
 * @returns {string[]}
 */
function getSentences(text) {
    return text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 5 && !DIALOGUE_FILLER.test(s));
}

/**
 * Strip dialogue filler from the start of a sentence
 * @param {string} sentence
 * @returns {string}
 */
function stripFiller(sentence) {
    return sentence.replace(DIALOGUE_FILLER, '').trim();
}

/**
 * Extract bug-related task information from text
 * @param {string} text
 * @returns {{ title, description, coreIssue, issueType, isWideScope }}
 */
function extractTaskInfo(text) {
    text = text.trim();
    const lower = text.toLowerCase();

    const bugIndicators = [
        "can't", 'cannot', 'broken', "doesn't", 'not working',
        "doesn't work", 'issue', 'bug', 'crashing', 'error',
        'fail', 'unable', 'wrong', 'crash', 'freeze'
    ];
    const isBugLike = bugIndicators.some(indicator => lower.includes(indicator));

    // Fallback for non-bug text sent to bug extractor
    if (!isBugLike) {
        const sentences = getSentences(text);
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

    const sentences = getSentences(text);

    const problemSentences = sentences.filter(s => {
        const sl = s.toLowerCase();
        return (
            sl.includes("can't") || sl.includes('cannot') || sl.includes('broken') ||
            sl.includes("doesn't") || sl.includes('not working') ||
            sl.includes('nothing shows') || sl.includes('issue') ||
            sl.includes('bug') || sl.includes('crashing') || sl.includes('error') ||
            sl.includes('fail') || sl.includes('unable') || sl.includes('wrong')
        ) && !sl.startsWith('why') && !sl.startsWith('did') && !sl.startsWith('maybe');
    });

    // Extract core issue noun phrase
    let coreIssue = '';

    if (problemSentences.length > 0) {
        const mainSentence = problemSentences[0];
        const patterns = [
            /(?:can't|cannot|doesn't|not working|issue with|problem with|broken)\s+(?:the\s+)?(?:my\s+)?(?:[a-z]+\s+)*([a-z]+(?:\s+[a-z]+)?)/i,
            /when\s+(?:i\s+)?([a-z]+(?:\s+[a-z]+)?)\s+(?:is|are|it)\s+(?:not|broken|fails|crashes)/i,
            /the\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:is|doesn't|can't|won't)\s+(?:work|function|respond)/i,
            /my\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:is|doesn't|can't)\s+(?:work|function)/i
        ];

        for (const pattern of patterns) {
            const match = mainSentence.match(pattern);
            if (match && match[1]) {
                const extracted = match[1].trim();
                if (!['is', 'a', 'the', 'and', 'or', 'not', 'but'].includes(extracted.toLowerCase())) {
                    coreIssue = capitalizeWords(extracted);
                    break;
                }
            }
        }
    }

    // Fallback: capitalized words
    if (!coreIssue && problemSentences.length > 0) {
        const words = problemSentences[0].match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/);
        if (words) coreIssue = words[0];
    }

    // Fallback: significant words
    if (!coreIssue && problemSentences.length > 0) {
        const wordList = problemSentences[0]
            .replace(/(?:can't|cannot|doesn't|not working|issue|bug|broken|error)/gi, '')
            .split(/\s+/)
            .filter(w => w.length > 4 && !['about', 'which', 'where', 'there', 'these'].includes(w.toLowerCase()));
        if (wordList.length > 0) coreIssue = capitalizeWords(wordList[0]);
    }

    if (!coreIssue) coreIssue = 'Reported Issue';

    const isRegression =
        lower.includes('work before') || lower.includes('worked before') ||
        lower.includes('worked last') || lower.includes('previously') ||
        lower.includes('used to work') || lower.includes('it was working') ||
        lower.includes('used to');

    const issueType = isRegression ? 'regression' : 'bug';

    const isWideScope =
        lower.includes('all ') || lower.includes('entire ') ||
        lower.includes('whole ') || lower.includes('every ') ||
        lower.includes('not just') || lower.includes("doesn't matter") ||
        lower.includes('all vehicles') || lower.includes('all trucks');

    const troubleshooted =
        lower.includes('restart') || lower.includes('reinstall') ||
        lower.includes('restarted') || lower.includes('reinstalled') ||
        lower.includes('tried');

    const title = generateSmartTitle(coreIssue, issueType);
    const description = generateComprehensiveDescription(coreIssue, issueType, isWideScope, troubleshooted, text);

    return { title, description, coreIssue, issueType, isWideScope };
}

/**
 * Generate a professional bug title
 */
function generateSmartTitle(coreIssue, issueType) {
    if (issueType === 'general_as_bug') {
        const title = `[TASK] ${coreIssue}`;
        return title.length > 75 ? title.substring(0, 72) + '...' : title;
    }

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

    let actionVerb = 'Not Functioning';
    const issueLower = coreIssue.toLowerCase();
    for (const [keyword, action] of Object.entries(actionMap)) {
        if (issueLower.includes(keyword)) {
            actionVerb = action;
            break;
        }
    }

    const title = issueType === 'regression'
        ? `[REGRESSION] ${coreIssue} – ${actionVerb} After Update`
        : `[BUG] ${coreIssue} – ${actionVerb}`;

    return title.length > 75 ? title.substring(0, 72) + '...' : title;
}

/**
 * Generate a comprehensive bug description from text
 */
function generateComprehensiveDescription(coreIssue, issueType, isWideScope, troubleshooted, fullText) {
    if (issueType === 'general_as_bug') {
        return fullText.substring(0, 300);
    }

    const sentences = getSentences(fullText);

    const problemSentences = sentences.filter(s => {
        const sl = s.toLowerCase();
        return (
            sl.includes("can't") || sl.includes('cannot') || sl.includes('broken') ||
            sl.includes("doesn't") || sl.includes('not working') ||
            sl.includes('issue') || sl.includes('bug') || sl.includes('error') ||
            sl.includes('fail') || sl.includes('unable') || sl.includes('wrong')
        ) && !sl.startsWith('why') && !sl.startsWith('did') && !sl.startsWith('maybe');
    });

    let description = '';

    if (problemSentences.length > 0) {
        const mainProblem = stripFiller(problemSentences[0]);
        description = mainProblem.charAt(0).toUpperCase() + mainProblem.slice(1) + '. ';
    }

    if (isWideScope) {
        const scopeSentence = sentences.find(s => {
            const sl = s.toLowerCase();
            return sl.includes('all ') || sl.includes('entire ') || sl.includes('whole ') || sl.includes('every ');
        });
        description += scopeSentence
            ? stripFiller(scopeSentence) + '. '
            : 'This affects the entire system (not isolated to one item). ';
    }

    if (issueType === 'regression') {
        const regressionSentence = sentences.find(s => {
            const sl = s.toLowerCase();
            return sl.includes('work before') || sl.includes('worked before') ||
                   sl.includes('previously') || sl.includes('used to work');
        });
        description += regressionSentence
            ? stripFiller(regressionSentence) + '. '
            : 'This feature was previously working but stopped after a recent update. ';
    }

    if (troubleshooted) {
        const troubleshootSentence = sentences.find(s => {
            const sl = s.toLowerCase();
            return sl.includes('restart') || sl.includes('reinstall') || sl.includes('tried');
        });
        description += troubleshootSentence
            ? stripFiller(troubleshootSentence) + '. '
            : 'Standard troubleshooting steps have been attempted without resolution. ';
    }

    const behaviorSentence = sentences.find(s => {
        const sl = s.toLowerCase();
        return sl.includes('nothing shows') || sl.includes('nothing happens') ||
               sl.includes('blank') || sl.includes('empty') || sl.includes('crash') ||
               sl.includes('freeze') || sl.includes('no error') || sl.includes('no feedback');
    });

    if (behaviorSentence) {
        description += stripFiller(behaviorSentence) + '. ';
    } else if (description.length < 100) {
        description += 'The feature does not function as intended. ';
    }

    description = description.replace(/\s+/g, ' ').trim();
    if (!description.endsWith('.')) description += '.';

    return description;
}

/**
 * Extract support task information from text
 */
function extractSupportInfo(text) {
    const lower = text.toLowerCase();
    const sentences = getSentences(text);

    const problemSentences = sentences.filter(s => {
        const sl = s.toLowerCase();
        return sl.includes('cannot') || sl.includes("can't") ||
               sl.includes("doesn't") || sl.includes('not working') || sl.includes('broken');
    });

    let brokenFeature = 'Feature';

    if (problemSentences.length > 0) {
        const patterns = [
            /(?:can't|cannot|doesn't|not working|issue with|problem with|broken)\s+(?:the\s+)?(?:my\s+)?(?:[a-z]+\s+)*([a-z]+(?:\s+[a-z]+)?)/i,
            /when\s+(?:i\s+)?(?:try\s+to\s+)?([a-z]+(?:\s+[a-z]+)?)\s+(?:is|are|it)\s+(?:not|broken|fails)/i,
            /the\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:is|doesn't|can't|won't)\s+(?:work|function)/i
        ];

        for (const pattern of patterns) {
            const match = problemSentences[0].match(pattern);
            if (match && match[1]) {
                const extracted = match[1].trim();
                if (!['is', 'a', 'the', 'and', 'or', 'not', 'but'].includes(extracted.toLowerCase())) {
                    brokenFeature = capitalizeWords(extracted);
                    break;
                }
            }
        }
    }

    const regressionKeywords = [
        'worked before', 'worked last', 'used to work', 'previously',
        'it was working', 'did work', 'was working'
    ];
    const isRegression = regressionKeywords.some(k => lower.includes(k));

    let title = isRegression
        ? `${brokenFeature} not working - Regression`
        : `${brokenFeature} not working`;

    if (problemSentences.length > 0) {
        const selectedStatement =
            problemSentences.find(s => s.toLowerCase().includes(brokenFeature.toLowerCase().split(' ')[0]))
            || problemSentences[0];

        const cleaned = stripFiller(selectedStatement).replace(/\?+$/, '');
        if (cleaned.length > 10 && cleaned.length < 90) {
            title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
    }

    const impactPatterns = [
        { keywords: ['multiple', 'all vehicles', 'all trucks', 'whole', 'everyone', 'widespread'], severity: 'Widespread impact - Critical scope' },
        { keywords: ['not just one', 'tried a different', 'not just me', 'both'], severity: 'Multiple users/items affected' }
    ];

    let impact = 'Single user/occurrence';
    for (const pattern of impactPatterns) {
        if (pattern.keywords.some(k => lower.includes(k))) {
            impact = pattern.severity;
            break;
        }
    }

    let category = 'Technical Error';
    if (isRegression) category = 'Regression - Feature Broken';
    else if (lower.includes('slow') || lower.includes('lag') || lower.includes('freeze')) category = 'Performance Issue';
    else if (lower.includes('save') || lower.includes('load') || lower.includes('sync')) category = 'Data Issue';
    else if (lower.includes('error') || lower.includes('crash') || lower.includes('fail')) category = 'Technical Error';
    else category = 'Feature Issue';

    let urgency = 'Normal';
    if (lower.includes('broken') || lower.includes('not working') || isRegression) urgency = 'High';
    if (lower.includes('urgent') || lower.includes('critical') || lower.includes('asap')) urgency = 'Critical/Urgent';

    let actions = '* Verify issue reproduction\n* Investigate root cause\n* Implement fix or workaround\n* Test resolution\n* Update customer';
    if (isRegression) {
        actions = '* [HIGH PRIORITY] Analyze recent changes\n* Identify what broke in last update\n* Implement rollback or fix\n* Extensive regression testing\n* Deploy fix immediately';
    }
    if (impact.includes('Multiple') || impact.includes('Widespread')) {
        actions = '* [CRITICAL] Escalate immediately\n' + actions;
    }

    const details = sentences.slice(0, 3).join(' ').trim();
    const detailsText = details.length > 180 ? details.substring(0, 177) + '...' : (details || text);

    return { title, category, details: detailsText, impact, actions, urgency, isRegression, brokenFeature };
}

/**
 * Extract general task information from text
 */
function extractGeneralInfo(text) {
    const sentences = getSentences(text);

    let title = 'Task';
    if (sentences.length > 0) {
        const cleaned = stripFiller(sentences[0]);
        title = cleaned.length > 85 ? cleaned.substring(0, 82) + '...' : (cleaned || sentences[0]);
    }

    let details = 'Complete as described';
    const detailPatterns = [
        /(?:need|required|must|should|have to)\s+([^.!?]+?)(?:\.|,|;|and|or|$)/i,
        /(?:to|in order to)\s+([^.!?]+?)(?:\.|,|;|and|or|$)/i
    ];

    for (const pattern of detailPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].length > 5) {
            details = match[1].trim();
            if (details.length > 150) details = details.substring(0, 147) + '...';
            break;
        }
    }

    if (details === 'Complete as described' && sentences.length > 1) {
        const meaningfulSent = sentences.find(s => {
            const sl = s.toLowerCase();
            return sl.includes('need') || sl.includes('required') || sl.includes('must') ||
                   sl.includes('should') || sl.includes('want') || sl.includes('make');
        });
        if (meaningfulSent) details = stripFiller(meaningfulSent);
    }

    const description = sentences.slice(0, 2).join(' ').trim();
    const descriptionText = description.length > 220
        ? description.substring(0, 217) + '...'
        : (description || text.substring(0, 217));

    return { title, description: descriptionText, details };
}

/**
 * Extract steps to reproduce from bug report text
 */
function extractStepsToReproduce(text, coreIssue) {
    const sentences = getSentences(text);
    const steps = [];

    // Step 1: initial action
    const actionKeywords = ['open', 'access', 'navigate', 'go to', 'launch', 'start', 'load', 'enter'];
    const initialAction = sentences.find(s => actionKeywords.some(k => s.toLowerCase().includes(k)));
    steps.push(initialAction
        ? `1. ${stripFiller(initialAction)}`
        : `1. Access/open the ${coreIssue.toLowerCase()}`
    );

    // Step 2: setup action
    const setupKeywords = ['select', 'choose', 'click', 'tap', 'configure', 'set', 'change', 'enable'];
    const setupAction = sentences.find(s => {
        const sl = s.toLowerCase();
        return setupKeywords.some(k => sl.includes(k)) &&
               !sl.includes("can't") && !sl.includes("doesn't") && !sl.includes('broken');
    });
    steps.push(setupAction
        ? `2. ${stripFiller(setupAction)}`
        : `2. Configure or select options when prompted`
    );

    // Step 3: trigger action
    const triggerKeywords = ['try', 'attempt', 'perform', 'apply', 'execute', 'use', 'run', 'save', 'submit'];
    const triggerAction = sentences.find(s => {
        const sl = s.toLowerCase();
        return triggerKeywords.some(k => sl.includes(k)) &&
               (sl.includes("can't") || sl.includes("doesn't") || sl.includes('broken') ||
                sl.includes('not working') || sl.includes('issue'));
    });

    if (triggerAction) {
        const cleaned = triggerAction
            .replace(/(?:can't|cannot|doesn't|not working|broken|issue|problem|bug)\s*/gi, '')
            .trim();
        // Only use if cleaning left meaningful content
        const step3 = cleaned.length > 5
            ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
            : 'Trigger the action that causes the issue';
        steps.push(`3. ${step3}`);
    } else {
        steps.push(`3. Trigger the action that causes the issue`);
    }

    // Step 4: observation
    steps.push(`4. Observe and note the unexpected behavior or error`);

    return steps.join('\n');
}

/**
 * Extract expected result from bug report text
 */
function extractExpectedResult(text, coreIssue) {
    const sentences = getSentences(text);

    const shouldPatterns = [
        /(?:should|should be|supposed to|expect|expected|want|need|must)\s+([^.!?]+?)(?:\.)?$/i,
        /(?:it|that|this|feature|system)\s+(?:should|must|would|will|can)\s+([^.!?]+?)$/i
    ];

    for (const sentence of sentences) {
        for (const pattern of shouldPatterns) {
            const match = sentence.match(pattern);
            if (match && match[1]) {
                const expected = match[1].trim();
                if (expected.length > 5 && expected.length < 150) {
                    return expected.charAt(0).toUpperCase() + expected.slice(1);
                }
            }
        }
    }

    const workingSentence = sentences.find(s => {
        const sl = s.toLowerCase();
        return (sl.includes('works') || sl.includes('applies') || sl.includes('displays') || sl.includes('shows')) &&
               !sl.includes("doesn't") && !sl.includes('not');
    });
    if (workingSentence) return stripFiller(workingSentence);

    // Dynamic fallback
    const lower = coreIssue.toLowerCase();
    if (lower.includes('save') || lower.includes('data')) return 'Data is saved and persists after reload';
    if (lower.includes('auth') || lower.includes('login')) return 'User is authenticated and gains access';
    if (lower.includes('upload') || lower.includes('download')) return 'File transfer completes successfully';
    if (lower.includes('audio') || lower.includes('video')) return 'Media plays smoothly without interruption';

    return `${coreIssue} functions as designed`;
}

/**
 * Extract actual result/behavior from bug report text
 */
function extractActualResult(text) {
    const lower = text.toLowerCase();
    const sentences = getSentences(text);

    for (const sentence of sentences) {
        const sl = sentence.toLowerCase();
        if (sl.includes('should') || sl.includes('expect') || sl.includes('supposed')) continue;

        if (sl.includes("can't") || sl.includes("doesn't") || sl.includes('broken') ||
            sl.includes('nothing shows') || sl.includes('nothing happens') ||
            sl.includes('crash') || sl.includes('freeze') || sl.includes('blank') || sl.includes('error')) {

            const actual = sentence
                .replace(/^(yeah|yep|ok|okay|so|and|but|when|instead)\s+/i, '')
                .replace(/^(?:can't|cannot|doesn't|shouldn't|isn't|not|broken|issue)\s+/i, '')
                .trim();

            if (actual.length > 5 && actual.length < 150) {
                return actual.charAt(0).toUpperCase() + actual.slice(1);
            }
        }
    }

    if (lower.includes('nothing shows') || lower.includes('nothing happens')) return 'Feature produces no output or result';
    if (lower.includes('crash') || lower.includes('freeze')) return 'Application becomes unresponsive or crashes';
    if (lower.includes('blank') || lower.includes('empty')) return 'Feature displays blank or empty state';
    if (lower.includes('error')) return 'Error occurs during operation';

    return 'Feature does not function as expected';
}

/**
 * Extract software version from text
 */
function extractVersion(text) {
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
        if (match) return match[1];
    }

    return null;
}

/**
 * Extract device/platform from text
 */
function extractDevice(text) {
    const lower = text.toLowerCase();

    const devicePatterns = [
        { name: 'iOS',     keywords: ['iphone', 'ipad', 'ios', 'apple'] },
        { name: 'Android', keywords: ['android', 'samsung', 'pixel', 'mobile'] },
        { name: 'Windows', keywords: ['windows', 'pc', 'desktop', 'computer'] },
        { name: 'macOS',   keywords: ['mac', 'osx', 'macos'] },
        { name: 'Linux',   keywords: ['linux'] },
        { name: 'Console', keywords: ['playstation', 'ps4', 'ps5', 'console'] },
        { name: 'Web',     keywords: ['browser', 'chrome', 'firefox', 'safari', 'edge', 'web'] }
    ];

    for (const pattern of devicePatterns) {
        if (pattern.keywords.some(k => lower.includes(k))) return pattern.name;
    }

    return null;
}

/**
 * Extract deadline from text
 */
function extractDeadline(text) {
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

    return null;
}