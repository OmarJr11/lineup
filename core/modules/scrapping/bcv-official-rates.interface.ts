/**
 * Parsed values from the BCV home page plus fetch metadata.
 */
export interface BcvOfficialRatesSnapshot {
  readonly dollar: number | null;
  readonly euro: number | null;
  readonly sourceDate: string | null;
}
