/**
 * Extracts JWT token from request without throwing when absent.
 * Returns null when no token is found.
 */
export const optionalTokenExtractor = (req: any): string | null => {
    if (req?.cookies) {
        if (req.cookies.token) return req.cookies.token as string;
        const keys = Object.keys(req.cookies || {});
        const preferEndToken = keys.find(
            (k) => typeof k === 'string' && /token$/i.test(k) && !/refresh/i.test(k)
        );
        if (preferEndToken) return req.cookies[preferEndToken] as string;
        const key = keys.find(
            (k) =>
                typeof k === 'string' &&
                k.toLowerCase().includes('token') &&
                !k.toLowerCase().includes('refresh')
        );
        if (key) return req.cookies[key] as string;
    }
    if (req?.headers?.token) return req.headers.token as string;
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    if (req?.headers?.cookie && typeof req.headers.cookie === 'string') {
        const raw = req.headers.cookie as string;
        const parts = raw.split(';').map((s) => s.trim());
        const prefer = parts.find((p) => {
            const [k] = p.split('=');
            return /token$/i.test(k) && !/refresh/i.test(k);
        });
        if (prefer) return decodeURIComponent(prefer.split('=')[1]);
        const any = parts.find((p) => {
            const [k] = p.split('=');
            return k.toLowerCase().includes('token') && !k.toLowerCase().includes('refresh');
        });
        if (any) return decodeURIComponent(any.split('=')[1]);
    }
    return null;
};
