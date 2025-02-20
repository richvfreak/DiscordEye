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

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Cliente conectado:', socket.id);

      socket.on('subscribe', (userId) => {
        console.log('Subscription request for user:', userId);
        if (!this.subscriptions.has(userId)) {
          this.subscriptions.set(userId, new Set());
        }
        this.subscriptions.get(userId).add(socket.id);
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        this.subscriptions.forEach((sockets, userId) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.subscriptions.delete(userId);
          }
        });
      });
    });

    // Escutar atualizações de presença
    if (this.presenceManager) {
      this.presenceManager.on('presenceUpdate', (presence) => {
        const userId = presence.userId;
        const subscribers = this.subscriptions.get(userId);
        if (subscribers) {
          subscribers.forEach(socketId => {
            this.io.to(socketId).emit('presenceUpdate', presence);
          });
        }
      });
    }
  }
}
