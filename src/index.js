import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, GatewayIntentBits } from 'discord.js';

import { DiscordBot } from './lib/bot.js';
import { ApiManager } from './lib/api.js';
import { PresenceManager } from './lib/presence.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { DatabaseManager } from './lib/database.js';
import { setupRoutes } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const intents = [
  1,  
  2,   
  256,  
  512
];

console.log('Intents configurados:', intents);

const presenceManager = new PresenceManager();
const apiManager = new ApiManager(presenceManager);
const bot = new DiscordBot(process.env.DISCORD_TOKEN, intents, presenceManager);

app.use(cors());
app.use(express.json());
app.use('/api', apiManager.getRouter());

app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

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

async function main() {
  try {
    const dbManager = new DatabaseManager();
    await dbManager.connect(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const presenceManager = new PresenceManager(dbManager);

    const bot = new DiscordBot(process.env.DISCORD_TOKEN, intents, presenceManager);
    await bot.start();

    app.use(express.json());

    setupRoutes(app, presenceManager);

    const port = process.env.PORT || 3001;
    server.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
      console.log(`Página de status disponível em: http://localhost:${port}/status`);
    });

    process.on('SIGINT', async () => {
      console.log('Desligando servidor...');
      await bot.stop();
      process.exit(0);
    });

    process.on('unhandledRejection', (error) => {
      console.error('Erro não tratado:', error);
    });
  } catch (error) {
    console.error('Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Erro ao iniciar aplicação:', error);
  process.exit(1);
});
