/**
 * Permissions scoped to the admin application (operators / moderators).
 */
export enum AdminPermissionsEnum {
    /** Login to the admin GraphQL/API (ADMLOG in database). */
    LOGIN = 'ADMLOG',
    /** View platform-wide admin statistics queries (ADMSTATS in database). */
    STATS = 'ADMSTATS',
}
