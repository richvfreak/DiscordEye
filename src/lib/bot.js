import { Client, GatewayIntentBits } from 'discord.js';
import { EventEmitter } from 'events';

export class DiscordBot extends EventEmitter {
  constructor(token, intents, presenceManager) {
    super();
    this.token = token;
    
    // Converter intents para BitField
    this.intents = intents.map(intent => {
      // Se já for um número, retornar direto
      if (typeof intent === 'number') return intent;
      
      // Se for um intent do GatewayIntentBits, converter para número
      if (typeof intent === 'object' && intent.valueOf) {
        return intent.valueOf();
      }
      
      return intent;
    });

    console.log('Intents processados:', this.intents);
    
    this.presenceManager = presenceManager;
    
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

    this.client.on('presenceUpdate', async (oldPresence, newPresence) => {
      try {
        console.log('Evento de presenceUpdate disparado');
        await this.updatePresence(oldPresence, newPresence);
      } catch (error) {
        console.error('Erro no evento de presenceUpdate:', error);
      }
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
      console.log('DEBUG: Atualizando presença para userId:', userId);
      console.log('DEBUG: Dados de newPresence recebidos:', JSON.stringify(newPresence, null, 2));

      // Se não temos o userId, não podemos continuar
      if (!userId) {
        console.error('ERRO: Não foi possível identificar o ID do usuário');
        return;
      }

      const user = await this.client.users.fetch(userId);
      console.log('DEBUG: Dados do usuário Discord completos:', JSON.stringify({
        id: user.id,
        username: user.username,
        tag: user.tag,
        globalName: user.globalName,
        displayName: user.displayName
      }, null, 2));

      // Forçar captura do username com fallbacks
      const username = 
        user.username || 
        user.globalName || 
        user.displayName || 
        user.tag.split('#')[0] || 
        'richvfreak';

      const presenceData = {
        userId: userId,
        user: {
          id: user.id,
          username: username,
          discriminator: user.discriminator || '0000',
          globalName: user.globalName || '',
          displayName: user.displayName || '',
          avatar: user.avatar
        },
        status: newPresence.status,
        activities: newPresence.activities,
        clientStatus: newPresence.clientStatus
      };

      console.log('DEBUG: Dados de presença a serem enviados:', JSON.stringify(presenceData, null, 2));
      this.presenceManager.updatePresence(presenceData);
    } catch (error) {
      console.error('ERRO ao atualizar presença:', error);
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
