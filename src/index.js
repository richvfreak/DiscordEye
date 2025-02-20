import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Client, GatewayIntentBits } from 'discord.js';

import { DiscordBot } from './lib/bot.js';
import { ApiManager } from './lib/api.js';
import { PresenceManager } from './lib/presence.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configuração correta e explícita dos Intents
const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.Presences
].map(intent => intent.valueOf());

console.log('Intents configurados:', intents);

const presenceManager = new PresenceManager();
const apiManager = new ApiManager(presenceManager);
const bot = new DiscordBot(process.env.DISCORD_TOKEN, intents, presenceManager);

app.use(cors());
app.use(express.json());
app.use('/api', apiManager.getRouter());

io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

bot.on('presenceUpdate', (oldPresence, newPresence) => {
  presenceManager.updatePresence(newPresence);
});

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

async function startServer() {
  try {
    await bot.start();
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
  }
}

startServer();
