// Create Task Feature - Generate tasks from text

/**
 * Create Task: Extract actionable tasks from text
 * @param {string} text - The text to extract task from
 * @returns {Promise<string>} - Formatted task information
 */
export async function createTask(text) {
    try {
        const task = generateTask(text);
        return formatTask(task);
    } catch (error) {
        throw new Error('Failed to create task: ' + error.message);
    }
}

/**
 * Generate task details from text
 * Placeholder - will be replaced with AI-powered extraction
 */
function generateTask(text) {
    // Extract first sentence as title
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const title = sentences[0]?.trim() || 'New Task';
    
    // Use full text as description
    const description = text.trim();
    
    // Suggest priority (placeholder logic)
    const priority = suggestPriority(text);
    
    return {
        title: cleanTitle(title),
        description: description,
        priority: priority,
        createdAt: new Date().toLocaleString()
    };
}

/**
 * Clean and shorten title
 */
function cleanTitle(title) {
    // Remove leading/trailing whitespace
    let clean = title.trim();
    
    // Capitalize first letter
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    
    // Limit to 60 characters
    if (clean.length > 60) {
        clean = clean.substring(0, 57) + '...';
    }
    
    return clean;
}

/**
 * Suggest priority based on keywords
 */
function suggestPriority(text) {
    const urgent = /urgent|asap|critical|immediately|emergency/i;
    const important = /important|essential|must|should|required/i;
    
    if (urgent.test(text)) {
        return 'HIGH';
    } else if (important.test(text)) {
        return 'MEDIUM';
    }
    return 'NORMAL';
}

/**
 * Format task for display
 */
function formatTask(task) {
    return `
✓ NEW TASK

Title:
${task.title}

Description:
${task.description}

Priority: ${task.priority}
Created: ${task.createdAt}

Ready to copy and add to your task manager!
    `.trim();
}
