import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';

/**
 * Attaches CORS configuration to the Socket.IO server used by Nest WebSockets.
 */
export class SocketIoCorsAdapter extends IoAdapter {
  /**
   * @param {INestApplication} app - Nest application root
   * @param {readonly string[]} corsOrigins - Allowed browser origins (same as HTTP CORS)
   */
  constructor(
    private readonly app: INestApplication,
    private readonly corsOrigins: readonly string[],
  ) {
    super(app);
  }

  /**
   * Creates the Socket.IO server with credentials-aware CORS.
   *
   * @param {number} port - Ignored when binding to HTTP; kept for IoAdapter contract
   * @param {ServerOptions} options - Base socket.io options
   * @returns {unknown} Socket.IO server instance
   */
  createIOServer(port: number, options?: ServerOptions): unknown {
    const corsOptions = {
      origin: [...this.corsOrigins],
      credentials: true,
      methods: ['GET', 'POST'],
    };
    return super.createIOServer(port, {
      ...options,
      cors: corsOptions,
    });
  }
}
