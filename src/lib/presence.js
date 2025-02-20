import { EventEmitter } from 'events';

export class PresenceManager extends EventEmitter {
    constructor() {
        super();
        this.presences = new Map();
    }

    updatePresence(newPresence) {
        console.log('DEBUG: Dados de presença recebidos COMPLETOS:', JSON.stringify(newPresence, null, 2));

        const userId = newPresence.userId || newPresence.user?.id;
        if (!userId) {
            console.error('ERRO: Não foi possível identificar o ID do usuário');
            return;
        }

        const currentPresence = this.presences.get(userId) || {};

        // Log detalhado para cada campo de username
        console.log('DEBUG: Campos de username:', {
            'newPresence.user?.username': newPresence.user?.username,
            'newPresence.username': newPresence.username,
            'currentPresence.username': currentPresence.username
        });

        const updatedPresence = {
            userId: userId,
            username: newPresence.user?.username || 
                      newPresence.username || 
                      currentPresence.username || 
                      '',
            discriminator: newPresence.user?.discriminator || 
                           currentPresence.discriminator || 
                           '0000',
            globalName: newPresence.user?.globalName || 
                        currentPresence.globalName || 
                        '',
            displayName: newPresence.user?.displayName || 
                         currentPresence.displayName || 
                         '',
            avatar: newPresence.user?.avatar || 
                    (newPresence.user?.avatarURL ? newPresence.user.avatarURL() : null) || 
                    currentPresence.avatar,
            status: newPresence.status || currentPresence.status || 'offline',
            activities: newPresence.activities || currentPresence.activities || [],
            
            // Novos campos
            activeOnWeb: newPresence.clientStatus?.web === 'online',
            activeOnDesktop: newPresence.clientStatus?.desktop === 'online',
            activeOnMobile: newPresence.clientStatus?.mobile === 'online',
            listeningToSpotify: newPresence.activities?.some(activity => activity.name === 'Spotify')
        };

        console.log('DEBUG: Presença atualizada:', JSON.stringify(updatedPresence, null, 2));

        this.presences.set(userId, updatedPresence);
        this.emit('presenceUpdate', updatedPresence);
    }

    getPresence(userId) {
        const presence = this.presences.get(userId);
        console.log(`DEBUG: Buscando presença para ${userId}:`, JSON.stringify(presence, null, 2));
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
