/**
 * Generates a URL-friendly slug from a string.
 * Lowercases, trims, and replaces spaces/special chars with hyphens.
 * @param {string} text - The text to convert.
 * @returns {string} The slug.
 */
export function toSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u00C0-\u024F-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
