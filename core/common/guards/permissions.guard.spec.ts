import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

/**
 * Unit tests for {@link PermissionsGuard}.
 */
describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  const reflectorMock = { get: jest.fn() } as unknown as Reflector;
  const checkerMock = {
    userHasPermission: jest.fn(),
    businessHasPermission: jest.fn(),
  };

  const buildContext = (user: Record<string, any>) =>
    ({
      getHandler: () => () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getArgByIndex: jest.fn(),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PermissionsGuard(reflectorMock, checkerMock as any);
  });

  it('allows access when no permissions metadata is set', async () => {
    (reflectorMock.get as jest.Mock).mockReturnValue(undefined);

    const result = await guard.canActivate(buildContext({ userId: 1 }));

    expect(result).toBe(true);
  });

  it('allows access when user has required permissions', async () => {
    (reflectorMock.get as jest.Mock)
      .mockReturnValueOnce(['read:users'])
      .mockReturnValueOnce([{ noPermission: 'Forbidden' }]);
    checkerMock.userHasPermission.mockResolvedValue(true);

    const result = await guard.canActivate(buildContext({ userId: 5 }));

    expect(result).toBe(true);
    expect(checkerMock.userHasPermission).toHaveBeenCalledWith(5, [
      'read:users',
    ]);
  });

  it('throws ForbiddenException when user lacks permissions', async () => {
    (reflectorMock.get as jest.Mock)
      .mockReturnValueOnce(['write:users'])
      .mockReturnValueOnce([{ noPermission: 'Not allowed' }]);
    checkerMock.userHasPermission.mockResolvedValue(false);

    await expect(
      guard.canActivate(buildContext({ userId: 5 })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows access when business has required permissions', async () => {
    (reflectorMock.get as jest.Mock)
      .mockReturnValueOnce(['manage:products'])
      .mockReturnValueOnce([{ noPermission: 'Forbidden' }]);
    checkerMock.businessHasPermission.mockResolvedValue(true);

    const result = await guard.canActivate(
      buildContext({ businessId: 10 }),
    );

    expect(result).toBe(true);
    expect(checkerMock.businessHasPermission).toHaveBeenCalledWith(10, [
      'manage:products',
    ]);
  });

  it('throws ForbiddenException when business lacks permissions', async () => {
    (reflectorMock.get as jest.Mock)
      .mockReturnValueOnce(['manage:products'])
      .mockReturnValueOnce([{ noPermission: 'No access' }]);
    checkerMock.businessHasPermission.mockResolvedValue(false);

    await expect(
      guard.canActivate(buildContext({ businessId: 10 })),
    ).rejects.toThrow(ForbiddenException);
  });
});
