export function ImageCode<T = string | any[]>(value: T): any {
    if (typeof value['value'] === 'string' && value['value'].trim() === '') {
        return null;
    }

    return value['value'];
}
