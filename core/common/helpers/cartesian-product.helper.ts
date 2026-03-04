/**
 * Computes the cartesian product of arrays.
 * Example: cartesianProduct([['a','b'], ['1','2']]) => [['a','1'], ['a','2'], ['b','1'], ['b','2']]
 * @param {string[][]} arrays - Array of option arrays (each inner array = one variation's options).
 * @returns {string[][]} All combinations.
 */
export function cartesianProduct(arrays: string[][]): string[][] {
    if (arrays.length === 0) return [[]];
    const [first, ...rest] = arrays;
    const restProduct = cartesianProduct(rest);
    return first.flatMap((item) =>
        restProduct.map((combo) => [item, ...combo])
    );
}

/**
 * Generates a unique SKU code for a product and its variation options.
 * @param {number} productId - The product ID.
 * @param {Record<string, string>} variationOptions - Map of variation title to selected option.
 * @returns {string} The generated SKU code.
 */
export function generateSkuCode(
    productId: number,
    variationOptions: Record<string, string>,
): string {
    if (Object.keys(variationOptions).length === 0) {
        return `P${productId}`;
    }
    const sortedEntries = Object.entries(variationOptions).sort(([a], [b]) =>
        a.localeCompare(b),
    );
    const suffix = sortedEntries
        .map(([, value]) =>
            value
                .substring(0, 4)
                .toUpperCase()
                .replace(/\s/g, ''),
        )
        .join('-');
    return `P${productId}-${suffix}`;
}
