import { Client, GatewayIntentBits, ActivityType, Collection } from 'discord.js';
import { EventEmitter } from 'events';

export class DiscordBot extends EventEmitter {
  constructor(token, intents, presenceManager) {
    super();
    this.token = token;
    this.intents = this.processIntents(intents);
    this.presenceManager = presenceManager;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; 
    this.userCache = new Collection();
    this.lastPresenceUpdate = new Map();
    this.rateLimitDelay = 2000; 
    
    this.client = new Client({ 
      intents: this.intents,
      fetchAllMembers: true,
      restRequestTimeout: 60000,
      presence: {
        activities: [{
          name: 'monitorando presenças',
          type: ActivityType.Watching
        }],
        status: 'online'
      }
    });

    this.setupEventHandlers();
  }

  processIntents(intents) {
    return intents.map(intent => {
      if (typeof intent === 'number') return intent;
      if (typeof intent === 'object' && intent.valueOf) {
        return intent.valueOf();
      }
      return intent;
    });
  }

  setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log('Bot conectado como:', this.client.user.tag);
      this.reconnectAttempts = 0; 
      await this.updateBotStatus();
      await this.initializePresences();
    });

    this.client.on('presenceUpdate', async (oldPresence, newPresence) => {
      try {
        const userId = newPresence.userId || newPresence.user?.id;
        
        const now = Date.now();
        const lastUpdate = this.lastPresenceUpdate.get(userId) || 0;
        if (now - lastUpdate < this.rateLimitDelay) {
          return;
        }
        this.lastPresenceUpdate.set(userId, now);

        await this.updatePresence(oldPresence, newPresence);
      } catch (error) {
        console.error('Erro no evento de presenceUpdate:', error);
      }
    });

    this.client.on('error', error => {
      console.error('Erro no bot:', error);
      this.emit('error', error);
      this.attemptReconnect();
    });

    this.client.on('disconnect', () => {
      console.warn('Bot desconectado');
      this.attemptReconnect();
    });

    this.client.on('reconnecting', () => {
      console.log('Tentando reconectar...');
    });


    this.client.on('guildCreate', async guild => {
      console.log(`Bot adicionado ao servidor: ${guild.name} (${guild.id})`);
      await this.initializeGuildPresences(guild);
      await this.updateBotStatus();
    });

    this.client.on('guildDelete', async guild => {
      console.log(`Bot removido do servidor: ${guild.name} (${guild.id})`);
      await this.updateBotStatus();
    });

    this.client.on('guildMemberAdd', async member => {
      console.log(`Novo membro ${member.user.tag} em ${member.guild.name}`);
      await this.cacheUser(member.user);
      this.emit('presenceUpdate', null, {
        userId: member.id,
        status: member.presence?.status || 'offline',
        activities: member.presence?.activities || []
      });
    });

    this.client.on('guildMemberRemove', member => {
      console.log(`Membro ${member.user.tag} saiu de ${member.guild.name}`);
    });

    this.client.on('rateLimited', rateLimitInfo => {
      console.warn('Rate limit atingido:', rateLimitInfo);
    });
  }

  async updateBotStatus() {
    try {
      const totalServers = this.client.guilds.cache.size;
      const totalMembers = this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
      
      await this.client.user.setPresence({
        activities: [{
          name: `${totalServers} servidores | ${totalMembers} membros`,
          type: ActivityType.Watching
        }],
        status: 'online'
      });
    } catch (error) {
      console.error('Erro ao atualizar status do bot:', error);
    }
  }

  async initializePresences() {
    console.log('Inicializando presenças de todos os servidores...');
    for (const guild of this.client.guilds.cache.values()) {
      await this.initializeGuildPresences(guild);
    }
  }

  async initializeGuildPresences(guild) {
    console.log(`Inicializando presenças para ${guild.name}...`);
    try {
      const members = await guild.members.fetch();
      console.log(`${members.size} membros encontrados em ${guild.name}`);
      
      for (const member of members.values()) {
        await this.cacheUser(member.user);
        await this.updatePresence(null, {
          userId: member.id,
          status: member.presence?.status || 'offline',
          activities: member.presence?.activities || []
        });
      }
    } catch (error) {
      console.error(`Erro ao inicializar presenças de ${guild.name}:`, error);
    }
  }

  async cacheUser(user) {
    if (!this.userCache.has(user.id)) {
      this.userCache.set(user.id, {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        globalName: user.globalName,
        displayName: user.displayName,
        avatar: user.avatar,
        lastUpdated: Date.now()
      });
    }
  }

  async getUser(userId) {
    try {
      if (this.userCache.has(userId)) {
        const cachedUser = this.userCache.get(userId);
        if (Date.now() - cachedUser.lastUpdated > 3600000) {
          const user = await this.client.users.fetch(userId);
          await this.cacheUser(user);
          return user;
        }
        return cachedUser;
      }

      const user = await this.client.users.fetch(userId);
      await this.cacheUser(user);
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  async getGuildMember(userId) {
    try {
      const guilds = this.client.guilds.cache;
      for (const guild of guilds.values()) {
        try {
          const member = await guild.members.fetch(userId);
          if (member) {
            await this.cacheUser(member.user);
            return member;
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar membro:', error);
      return null;
    }
  }

  async updatePresence(oldPresence, newPresence) {
    try {
      const userId = newPresence.userId || newPresence.user?.id;
      if (!userId) {
        console.error('ERRO: Não foi possível identificar o ID do usuário');
        return;
      }

      let userData = this.userCache.get(userId);
      if (!userData) {
        const user = await this.getUser(userId);
        if (!user) {
          console.error('ERRO: Usuário não encontrado');
          return;
        }
        userData = this.userCache.get(userId);
      }

      const presenceData = {
        userId: userId,
        user: {
          id: userData.id,
          username: userData.username || `user_${userId}`,
          discriminator: userData.discriminator || '0000',
          globalName: userData.globalName || userData.username,
          displayName: userData.displayName || userData.username,
          avatar: userData.avatar
        },
        status: newPresence.status || 'offline',
        activities: this.processActivities(newPresence.activities),
        clientStatus: newPresence.clientStatus || {},
        lastUpdate: Date.now()
      };

      this.presenceManager.updatePresence(presenceData);
    } catch (error) {
      console.error('ERRO ao atualizar presença:', error);
    }
  }

  processActivities(activities = []) {
    return activities.map(activity => ({
      name: activity.name,
      type: activity.type,
      details: activity.details,
      state: activity.state,
      timestamps: activity.timestamps,
      assets: activity.assets ? {
        large_image: activity.assets.largeImage,
        large_text: activity.assets.largeText,
        small_image: activity.assets.smallImage,
        small_text: activity.assets.smallText
      } : null,
      application_id: activity.applicationId
    }));
  }

  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Número máximo de tentativas de reconexão atingido');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        console.error('Erro na tentativa de reconexão:', error);
        await this.attemptReconnect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  async start() {
    try {
      await this.client.login(this.token);
    } catch (error) {
      console.error('Erro ao iniciar bot:', error);
      throw error;
    }
  }

  async stop() {
    try {
      this.userCache.clear();
      this.lastPresenceUpdate.clear();
      await this.client.destroy();
    } catch (error) {
      console.error('Erro ao parar bot:', error);
    }
  }
}
