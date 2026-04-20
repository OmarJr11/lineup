import type { INestApplication } from '@nestjs/common';
import { NotificationsResolver } from '../src/notifications/notifications.resolver';
import { NotificationsService } from '../../../core/modules/notifications/notifications.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses Notifications e2e', () => {
  const notificationsServiceMock = {
    findPaginatedForBusiness: jest.fn(),
    countUnreadForBusiness: jest.fn(),
    markAsReadForBusiness: jest.fn(),
    markAllAsReadForBusiness: jest.fn(),
  };
  const providers = [
    { provide: NotificationsService, useValue: notificationsServiceMock },
  ];

  const myBusinessNotificationsQuery = `query MyBusinessNotifications($pagination: InfinityScrollInput!) { myBusinessNotifications(pagination: $pagination) { total } }`;
  const unreadBusinessNotificationsCountQuery = `query UnreadBusinessNotificationsCount { unreadBusinessNotificationsCount }`;
  const markBusinessNotificationReadMutation = `mutation MarkBusinessNotificationRead($id: Int!) { markBusinessNotificationRead(id: $id) { id } }`;
  const markAllBusinessNotificationsReadMutation = `mutation MarkAllBusinessNotificationsRead { markAllBusinessNotificationsRead }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [NotificationsResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers myBusinessNotifications', async () => {
    notificationsServiceMock.findPaginatedForBusiness.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: myBusinessNotificationsQuery,
      variables: { pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.myBusinessNotifications.total).toBe(1);
  });
  it('covers unreadBusinessNotificationsCount', async () => {
    notificationsServiceMock.countUnreadForBusiness.mockResolvedValue(3);
    const response = await executeGraphql({
      app,
      query: unreadBusinessNotificationsCountQuery,
    });
    expect(response.body.data.unreadBusinessNotificationsCount).toBe(3);
  });
  it('covers markBusinessNotificationRead', async () => {
    notificationsServiceMock.markAsReadForBusiness.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: markBusinessNotificationReadMutation,
      variables: { id: 1 },
    });
    expect(response.body.data.markBusinessNotificationRead.id).toBe(1);
  });
  it('covers markAllBusinessNotificationsRead', async () => {
    notificationsServiceMock.markAllAsReadForBusiness.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: markAllBusinessNotificationsReadMutation,
    });
    expect(response.body.data.markAllBusinessNotificationsRead).toBe(true);
  });
});
