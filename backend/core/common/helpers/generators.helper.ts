/**
 *  Generate a random string
 *
 * @param {number} length - length of the string to generate
 */
export function generateRandomCodeByLength(length: number) {
    let result = '';

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}
