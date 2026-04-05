import { NotificationContentScenarioEnum } from '../enums/notification-content-scenario.enum';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

/**
 * Single translation block (title + message + optional deep link path).
 */
export interface INotificationPublicLocaleBlock {
  readonly title: string;
  readonly message: string;
  readonly link?: string;
}

/**
 * One notification kind: persisted {@link NotificationTypeEnum} plus en/es copy.
 */
export interface INotificationPublicEntry {
  readonly type: NotificationTypeEnum;
  readonly es: INotificationPublicLocaleBlock;
}

/**
 * Central catalog of user-facing notification strings for this product (extend per feature).
 * Mirrors the pattern: `notificationsPublic[identifier][locale]`.
 */
export const notificationsPublic: Record<
  NotificationContentScenarioEnum,
  INotificationPublicEntry
> = {
  [NotificationContentScenarioEnum.USER_CHANGE_PASSWORD]: {
    type: NotificationTypeEnum.WARNING,
    es: {
      title: 'Contraseña actualizada',
      message: 'Tu contraseña se cambió correctamente.',
      link: '/configuration',
    },
  },
  [NotificationContentScenarioEnum.BUSINESS_CHANGE_PASSWORD]: {
    type: NotificationTypeEnum.WARNING,
    es: {
      title: 'Contraseña actualizada',
      message:
        'La contraseña de la cuenta de tu negocio se cambió correctamente.',
      link: 'businesses/configuration',
    },
  },
  [NotificationContentScenarioEnum.NEW_PRODUCT_REVIEW]: {
    type: NotificationTypeEnum.INFO,
    es: {
      title: 'Nueva reseña de producto',
      message: 'Un cliente dejó una reseña en uno de tus productos.',
    },
  },
};
