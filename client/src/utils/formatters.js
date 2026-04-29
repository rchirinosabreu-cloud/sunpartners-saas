/**
 * Formats a string to Sentence case (first letter uppercase, the rest lowercase).
 * Handles null/undefined and empty strings.
 * @param {string} str
 * @returns {string}
 */
export const toSentenceCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    const trimmed = str.trim();
    if (trimmed.length === 0) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Formats a string to Title Case (first letter of each word uppercase).
 * Useful for proper names.
 * @param {string} str
 * @returns {string}
 */
export const toTitleCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Helper to normalize data that might be in ALL CAPS.
 * If the string is already mixed case, it might just return it,
 * but usually we want to enforce Sentence case for labels/titles.
 */
export const normalizeData = (str) => {
    if (!str) return '';
    // If it's all uppercase and longer than 3 chars, it's likely legacy all-caps data
    if (str === str.toUpperCase() && str.length > 3) {
        return toSentenceCase(str);
    }
    return str;
};

/**
 * Normalizes text for search: lowercase, removes accents/tildes.
 * @param {string} text
 * @returns {string}
 */
export const normalizeText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

/**
 * Checks if a target string matches a multi-term search query using AND logic.
 * @param {string} target
 * @param {string} query
 * @returns {boolean}
 */
export const matchesSearch = (target, query) => {
    const normalizedTarget = normalizeText(target);
    const normalizedQuery = normalizeText(query);
    const searchTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
    if (searchTerms.length === 0) return true;
    return searchTerms.every(term => normalizedTarget.includes(term));
};
