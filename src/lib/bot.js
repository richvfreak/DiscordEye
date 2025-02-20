import { Client, GatewayIntentBits } from 'discord.js';
import { EventEmitter } from 'events';

export class DiscordBot extends EventEmitter {
  constructor(token, intents, presenceManager) {
    super();
    this.token = token;
    this.intents = intents;
    this.presenceManager = presenceManager;
    
    console.log('Intents configurados:', this.intents);
    
    this.client = new Client({ 
      intents: this.intents,
      fetchAllMembers: true,
      restRequestTimeout: 60000
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log('Bot conectado como:', this.client.user.tag);
      
      // Listar servidores onde o bot está
      console.log('Servidores conectados:');
      this.client.guilds.cache.forEach(async guild => {
        console.log(`- ${guild.name} (${guild.id})`);
        
        // Buscar membros do servidor
        try {
          const members = await guild.members.fetch();
          console.log(`Membros em ${guild.name}:`, members.size);
          
          // Emitir presença inicial para cada membro
          members.forEach(member => {
            console.log(`Presença inicial para ${member.user.tag}:`, member.presence);
            this.emit('presenceUpdate', null, {
              userId: member.id,
              status: member.presence?.status || 'offline',
              activities: member.presence?.activities || []
            });
          });
        } catch (error) {
          console.error(`Erro ao buscar membros de ${guild.name}:`, error);
        }
      });

      this.emit('ready');
    });

    this.client.on('presenceUpdate', (oldPresence, newPresence) => {
      if (!newPresence) {
        console.log('Presença nula recebida');
        return;
      }

      console.log('Atualização de presença detectada:', {
        userId: newPresence.userId,
        status: newPresence.status,
        activities: newPresence.activities?.map(a => ({
          name: a.name,
          type: a.type,
          details: a.details,
          state: a.state
        }))
      });
      
      this.emit('presenceUpdate', oldPresence, {
        userId: newPresence.userId,
        status: newPresence.status,
        activities: newPresence.activities || []
      });
    });

    this.client.on('error', error => {
      console.error('Erro no bot:', error);
      this.emit('error', error);
    });

    this.client.on('guildCreate', guild => {
      console.log(`Bot adicionado ao servidor: ${guild.name} (${guild.id})`);
    });

    this.client.on('guildMemberAdd', member => {
      console.log(`Novo membro ${member.user.tag} em ${member.guild.name}`);
      this.emit('presenceUpdate', null, {
        userId: member.id,
        status: member.presence?.status || 'offline',
        activities: member.presence?.activities || []
      });
    });
  }

  async getUser(userId) {
    try {
      const user = await this.client.users.fetch(userId);
      console.log('Usuário encontrado:', user.tag);
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
            console.log(`Membro encontrado no servidor ${guild.name}`);
            return member;
          }
        } catch (e) {
        }
      }
      console.log('Membro não encontrado em nenhum servidor');
      return null;
    } catch (error) {
      console.error('Erro ao buscar membro:', error);
      return null;
    }
  }

  async updatePresence(oldPresence, newPresence) {
    try {
      const userId = newPresence.userId || newPresence.user?.id;
      console.log('Atualizando presença para userId:', userId);
      console.log('Dados de newPresence recebidos:', JSON.stringify(newPresence, null, 2));

      if (!userId) {
        console.error('Não foi possível identificar o ID do usuário');
        return;
      }

      const user = await this.client.users.fetch(userId);
      console.log('Dados do usuário Discord completos:', JSON.stringify(user, null, 2));

      const presenceData = {
        userId: userId,
        user: {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator,
          globalName: user.globalName,
          displayName: user.displayName,
          avatar: user.avatar
        },
        status: newPresence.status,
        activities: newPresence.activities,
        clientStatus: newPresence.clientStatus
      };

      console.log('Dados de presença a serem enviados:', JSON.stringify(presenceData, null, 2));
      this.presenceManager.updatePresence(presenceData);
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
    }
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
      await this.client.destroy();
    } catch (error) {
      console.error('Erro ao parar bot:', error);
    }
  }
}
