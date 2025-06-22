import { Request } from 'express';
import { IReqWithCookies } from '../interfaces';

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
            result = result && !req.get('referer')?.includes(referer);
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
    let domain: string[] = [];

    try {
        domain = process.env.COOKIE_DOMAIN.split(',');
    } catch { }

    return domain.map((d) => d.trim());
}

/**
 * Get agent to sign cookie
 *
 * @param {ReqWithCookies} req - request to get information
 * @param {string[]} domains - Acceptable domains
 * @returns {string} - agent to use to sign the cookie
 */
export function getRequestAgent(req: IReqWithCookies, domains: string[]): string {
    let agent = 'localhost';

    for (const d of domains) {
        if (req.get('referer')?.includes(d)) {
            agent = d;
            break;
        }
    }

    return agent;
}
