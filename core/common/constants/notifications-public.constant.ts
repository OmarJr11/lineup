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
  [NotificationContentScenarioEnum.DISCOUNT_ACTIVATED]: {
    type: NotificationTypeEnum.INFO,
    es: {
      title: 'Descuento activado',
      message:
        'Uno de tus descuentos programados ya está activo y visible para tus clientes.',
      link: 'dashboard/discounts',
    },
  },
  [NotificationContentScenarioEnum.DISCOUNT_EXPIRED]: {
    type: NotificationTypeEnum.INFO,
    es: {
      title: 'Descuento finalizado',
      message: 'Un descuento alcanzó su fecha de término y dejó de aplicarse.',
      link: 'dashboard/discounts',
    },
  },
  [NotificationContentScenarioEnum.PRODUCT_LOW_STOCK]: {
    type: NotificationTypeEnum.WARNING,
    es: {
      title: 'Stock bajo',
      message: 'Uno de tus productos tiene stock bajo. Revisa tu inventario.',
      link: 'dashboard/inventory',
    },
  },
};
