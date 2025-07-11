/**
 * Convert the words to the word format to search
 * @param {string} words - Words to search
 * @returns {string}
 */
export function formatSearchWords(words: string): string {
    let newWord: string = '%';
    const er = /([A-Z]|[a-z]|[0-9]|)/;
    for (const w of words) {
        if (w.match(er)[0]) {
            newWord += w;
        } else {
            newWord += w === ' ' ? '%' : '_';
        }
    }
    return newWord + '%';
}
