import express from 'express';
import { DiscordBot } from './lib/bot.js';
import { PresenceManager } from './lib/presence.js';
import { ApiManager } from './lib/api.js';
import { SocketManager } from './lib/socket.js';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const presenceManager = new PresenceManager();
const bot = new DiscordBot(process.env.DISCORD_TOKEN);
const apiManager = new ApiManager(presenceManager);
const socketManager = new SocketManager(presenceManager);

bot.on('presenceUpdate', (oldPresence, newPresence) => {
  presenceManager.updatePresence(newPresence);
});

app.use(express.json());
app.use('/api', apiManager.getRouter());

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

socketManager.attach(app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  bot.start();
}));
