import { EventEmitter } from 'events';

export class PresenceManager extends EventEmitter {
  constructor() {
    super();
    this.presences = new Map();
  }

  updatePresence(presence) {
    if (!presence || !presence.userId) {
      console.log('Presença inválida recebida:', presence);
      return;
    }

    console.log('Atualizando presença para usuário:', presence.userId);
    this.presences.set(presence.userId, presence);
    this.emit('presenceUpdate', presence);
  }

  getPresence(userId) {
    console.log('Buscando presença para usuário:', userId);
    const presence = this.presences.get(userId);
    console.log('Presença em cache:', presence);
    return presence || {
      userId,
      status: 'offline',
      activities: []
    };
  }

  getPresences(userIds) {
    console.log('Buscando presença para usuários:', userIds);
    return userIds.map(userId => this.getPresence(userId));
  }

  getAllPresences() {
    return Array.from(this.presences.values());
  }
}
