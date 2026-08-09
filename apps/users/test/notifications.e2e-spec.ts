import type { INestApplication } from '@nestjs/common';
import { NotificationsResolver } from '../src/notifications/notifications.resolver';
import { NotificationsService } from '../../../core/modules/notifications/notifications.service';
import { executeGraphql } from './helpers/graphql-request.helper';
import { createTestApp } from './helpers/test-app.factory';

describe('Users Notifications e2e', () => {
  const notificationsServiceMock = {
    findPaginatedForUser: jest.fn(),
    countUnreadForUser: jest.fn(),
    markAsReadForUser: jest.fn(),
    markAllAsReadForUser: jest.fn(),
  };

  const providers = [
    { provide: NotificationsService, useValue: notificationsServiceMock },
  ];

  const myNotificationsQuery = `
    query MyNotifications($pagination: InfinityScrollInput!) {
      myNotifications(pagination: $pagination) {
        items {
          id
          title
          body
          type
        }
        total
        page
        limit
      }
    }
  `;

  const unreadNotificationsCountQuery = `
    query UnreadNotificationsCount {
      unreadNotificationsCount
    }
  `;

  const markAllNotificationsReadMutation = `
    mutation MarkAllNotificationsRead {
      markAllNotificationsRead
    }
  `;

  const markNotificationReadMutation = `
    mutation MarkNotificationRead($id: Int!) {
      markNotificationRead(id: $id) {
        id
        title
      }
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [NotificationsResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns paginated notifications for authenticated user', async () => {
    notificationsServiceMock.findPaginatedForUser.mockResolvedValue([
      {
        id: 51,
        title: 'New discount',
        body: 'A new discount is available',
        type: 'INFO',
      },
    ]);

    const response = await executeGraphql({
      app,
      query: myNotificationsQuery,
      variables: {
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myNotifications.total).toBe(1);
    expect(response.body.data.myNotifications.items[0].id).toBe(51);
  });

  it('returns unread notification count', async () => {
    notificationsServiceMock.countUnreadForUser.mockResolvedValue(4);

    const response = await executeGraphql({
      app,
      query: unreadNotificationsCountQuery,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.unreadNotificationsCount).toBe(4);
  });

  it('marks all notifications as read for current user', async () => {
    notificationsServiceMock.markAllAsReadForUser.mockResolvedValue(undefined);

    const response = await executeGraphql({
      app,
      query: markAllNotificationsReadMutation,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.markAllNotificationsRead).toBe(true);
  });

  it('marks a single notification as read', async () => {
    notificationsServiceMock.markAsReadForUser.mockResolvedValue({
      id: 51,
      title: 'New discount',
      body: 'A new discount is available',
      type: 'INFO',
    });

    const response = await executeGraphql({
      app,
      query: markNotificationReadMutation,
      variables: {
        id: 51,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.markNotificationRead.id).toBe(51);
  });
});
