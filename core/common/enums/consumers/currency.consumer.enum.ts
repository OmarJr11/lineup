/**
 * Currency queue job types (BCV official rates, etc.).
 */
export enum CurrencyConsumerEnum {
  /** Scrape BCV and persist the official USD/EUR snapshot to Redis when the date matches. */
  SaveDataCurrencyBCV = 'SaveDataCurrencyBCV',
}
