/**
 * Internal type for business seed data (no GraphQL input).
 */
export interface ISeedBusinessData {
    email: string;
    emailValidated?: boolean;
    telephone?: string;
    name: string;
    description?: string;
    path: string;
    tags?: string[];
    followers?: number;
    visits?: number;
    password?: string;
    imgCode?: string;
}
