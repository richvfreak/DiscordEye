import { Server } from 'socket.io';

export class SocketManager {
  constructor(server, presenceManager) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.presenceManager = presenceManager;
    this.subscriptions = new Map();
  }

  attach() {
    this.io.on('connection', (socket) => {
      console.log('Cliente conectado:', socket.id);

      socket.on('subscribe', (userId) => {
        console.log(`Cliente ${socket.id} inscrito para usuário ${userId}`);
        this.subscriptions.set(socket.id, userId);
      });

      socket.on('subscribe_bulk', (userIds) => {
        if (Array.isArray(userIds)) {
          console.log(`Cliente ${socket.id} inscrito para usuários:`, userIds);
          this.subscriptions.set(socket.id, userIds);
        }
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        this.subscriptions.delete(socket.id);
      });
    });

    this.presenceManager.on('presenceUpdate', (presence) => {
      this.io.emit('presenceUpdate', presence);
    });
  }
}
