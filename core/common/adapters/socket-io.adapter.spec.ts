import { SocketIoCorsAdapter } from './socket-io.adapter';
import { IoAdapter } from '@nestjs/platform-socket.io';

describe('SocketIoCorsAdapter', () => {
  it('passes CORS configuration to super.createIOServer', () => {
    const appMock = {
      getHttpServer: jest.fn().mockReturnValue({}),
    } as any;
    const origins = ['http://localhost:3000', 'https://myapp.com'];
    const adapter = new SocketIoCorsAdapter(appMock, origins);

    const superSpy = jest
      .spyOn(IoAdapter.prototype, 'createIOServer')
      .mockImplementation((port, options) => ({ port, options }));

    const server: any = adapter.createIOServer(8080, { path: '/ws' } as any);

    expect(superSpy).toHaveBeenCalledWith(
      8080,
      expect.objectContaining({
        path: '/ws',
        cors: {
          origin: origins,
          credentials: true,
          methods: ['GET', 'POST'],
        },
      }),
    );

    expect(server.port).toBe(8080);
    superSpy.mockRestore();
  });
});
