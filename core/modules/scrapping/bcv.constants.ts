/**
 * URLs and Redis settings for the official BCV USD/EUR snapshot.
 */
export const BCV_OFFICIAL_CONFIG = {
  /** Official BCV site used for USD/EUR reference rates (VES). */
  url: 'https://www.bcv.org.ve/',
  /** Redis key for the latest scraped BCV snapshot (JSON). */
  cacheKey: 'bcv:official:snapshot',
  /** Cache TTL for BCV snapshot (seconds); 7 days. */
  cacheTtlSeconds: 7 * 86_400,
} as const;
