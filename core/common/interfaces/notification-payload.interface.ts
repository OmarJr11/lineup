/**
 * Metadata stored as JSONB on a notification for routing and UI actions.
 * Extend with new optional fields when product flows need them.
 */
export interface INotificationPayload {
  /** ID of the entity to open when the user taps the notification */
  idUser?: number;
  idBusiness?: number;

  /** Link to open when the user taps the notification */
  link?: string;

  /** Entity to open when the user taps the notification */
  entity?: string;

  /** Scenario to open when the user taps the notification */
  scenario?: string;

  /** ID of the entity to open when the user taps the notification */
  id?: number;

  /** Title of the catalog to open when the user taps the notification */
  catalogPath?: string;

  /** Title of the product to open when the user taps the notification */
  productTitle?: string;
}
