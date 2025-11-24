import { Request } from 'express';

export function invalidReferersRequest(req: Request): boolean {
    let referers: string[] = [];

    try {
        referers = process.env.REQUEST_REFERER.split(',');
    } catch { }

    let result: boolean = true;
    let index = 0;

    while (result && index < referers.length) {
        const referer = referers[index].trim();

        if (referer !== '') {
            // Protect against req.get being undefined (some contexts may not provide express Request)
            const header = typeof req?.get === 'function' ? req.get('referer') : undefined;
            result = result && !header?.includes(referer);
        }
        index++;
    }

    return result;
}

/**
 * Get Array of acceptable domains (use to sign cookies)
 *
 * @returns {string[]} - Acceptable domains
 */
export function getAcceptableDomains(): string[] {
    let domain: string[] = process.env.MAIN_DOMAIN.split(',') || [];
    return domain.map((d) => d.trim());
}

/**
 * Get agent to sign cookie
 *
 * @param {Request} req - request to get information
 * @param {string[]} domains - Acceptable domains
 * @returns {string} - agent to use to sign the cookie
 */
export function getRequestAgent(req: Request, domains: string[]): string {
    let agent = 'localhost';

    for (const d of domains) {
        // Protect against req.get being undefined
        const header = typeof req?.get === 'function' ? req.get('referer') : undefined;
        if (header?.includes(d)) {
            agent = d;
            break;
        }
    }

    return agent;
}
