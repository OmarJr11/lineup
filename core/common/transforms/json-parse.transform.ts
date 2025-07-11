export function JsonParse<T = any>(value: T): any {
    if (typeof value['value'] === 'string') {
        return value['value'] === 'null' ? null : JSON.parse(value['value'].trim());
    }

    return value['value'];
}
