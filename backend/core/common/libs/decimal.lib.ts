import Decimal from 'decimal.js';

/**
 * Sum two numbers
 * @param {number} number1 - First number
 * @param {number} number2 - Second number
 * @returns {number}
 */
export function sum(number1: number, number2: number): number {
    const decimal1 = new Decimal(number1);
    const decimal2 = new Decimal(number2);
    return decimal1.plus(decimal2).toNumber();
}

/**
 * subtract two numbers
 * @param {number} number1 - First number
 * @param {number} number2 - Second number
 * @returns {number}
 */
export function subtract(number1: number, number2: number): number {
    const decimal1 = new Decimal(number1);
    const decimal2 = new Decimal(number2);
    return decimal1.minus(decimal2).toNumber();
}

/**
 * multiply two numbers
 * @param {number} number1 - First number
 * @param {number} number2 - Second number
 * @returns {number}
 */
export function multiply(number1: number, number2: number): number {
    const decimal1 = new Decimal(number1);
    const decimal2 = new Decimal(number2);
    return decimal1.mul(decimal2).toNumber();
}

/**
 * divide two numbers
 * @param {number} number1 - First number
 * @param {number} number2 - Second number
 * @returns {number}
 */
export function divide(number1: number, number2: number): number {
    const decimal1 = new Decimal(number1);
    const decimal2 = new Decimal(number2);
    return decimal1.div(decimal2).toNumber();
}
