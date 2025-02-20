import { EventEmitter } from 'events';

export class PresenceManager extends EventEmitter {
  constructor() {
    super();
    this.presences = new Map();
  }

  updatePresence(newPresence) {
    const userId = newPresence.userId;
    const currentPresence = this.presences.get(userId) || {};

    const updatedPresence = {
      userId: userId,
      username: newPresence.user?.username || currentPresence.username,
      discriminator: newPresence.user?.discriminator || currentPresence.discriminator,
      globalName: newPresence.user?.globalName || currentPresence.globalName,
      displayName: newPresence.user?.displayName || currentPresence.displayName,
      avatar: newPresence.user?.avatarURL() || currentPresence.avatar,
      status: newPresence.status || currentPresence.status,
      activities: newPresence.activities || currentPresence.activities || [],
      
      // Novos campos
      activeOnWeb: newPresence.clientStatus?.web === 'online',
      activeOnDesktop: newPresence.clientStatus?.desktop === 'online',
      activeOnMobile: newPresence.clientStatus?.mobile === 'online',
      listeningToSpotify: newPresence.activities?.some(activity => activity.name === 'Spotify')
    };

    this.presences.set(userId, updatedPresence);
    this.emit('presenceUpdate', updatedPresence);
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

  getAllPresences(userIds) {
    return userIds.map(userId => this.presences.get(userId)).filter(Boolean);
  }
}
