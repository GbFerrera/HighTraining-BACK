import { Server as SocketIOServer } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
    
    interface Application {
      get(name: 'socketio'): SocketIOServer;
      set(name: 'socketio', value: SocketIOServer): void;
    }
  }
}

export {};
