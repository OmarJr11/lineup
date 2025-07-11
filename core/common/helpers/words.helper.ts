import _ = require('lodash');

/**
 * Word to remove the accents and put it in lowercase
 *
 * @param {string} word - word to convert
 * @returns {string}
 */
export function toLowerCaseWithoutAccents(word: string): string {
    if (!word) return '';
    word = word.toLowerCase().trim();
    const letters = {
        á: 'a',
        é: 'e',
        í: 'i',
        ó: 'o',
        ú: 'u',
        ü: 'u',
    };

    let newWord = '';
    const length = word.length;

    for (let i = 0; i < length; i++) {
        let letter = word[i];

        if ((i === length - 1 || i === 0) && isForbiddenCharter(word[i])) {
            letter = '';
        } else {
            const findLetter = _.find(letters, (value, index) => index === letter);
            letter = findLetter ? findLetter : letter;
        }

        newWord += letter;
    }

    if (newWord.includes('nbsp')) return '';
    return newWord;
}

/**
 * Function to identify if a character is a forbidden
 * character at the beginning or end of a string
 *
 * @param {*} characters - array of words
 * @returns {boolean}
 */
function isForbiddenCharter(characters: any): boolean {
    const forbiddenCharters = [',', '.', ';', ':', '-', '_', '|', '/', '*', '&'];

    return forbiddenCharters.some((e) => e === characters);
}
