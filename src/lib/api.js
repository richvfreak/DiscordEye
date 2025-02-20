import express from 'express';

export class ApiManager {
  constructor(presenceManager) {
    this.presenceManager = presenceManager;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get('/users/:userId', async (req, res) => {
      try {
        const userId = req.params.userId;
        const presenceData = this.presenceManager.getPresence(userId);

        if (!presenceData) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        const response = {
          data: {
            kv: {},
            discord_user: {
              id: presenceData.userId,
              username: presenceData.username || '',
              avatar: presenceData.avatar || '',
              discriminator: presenceData.discriminator || '0',
              clan: null,
              avatar_decoration_data: null,
              bot: false,
              global_name: presenceData.globalName || '',
              primary_guild: null,
              display_name: presenceData.displayName || '',
              public_flags: 0
            },
            activities: presenceData.activities || [],
            discord_status: presenceData.status || 'offline',
            active_on_discord_web: presenceData.activeOnWeb || false,
            active_on_discord_desktop: presenceData.activeOnDesktop || false,
            active_on_discord_mobile: presenceData.activeOnMobile || false,
            listening_to_spotify: presenceData.listeningToSpotify || false,
            spotify: null
          },
          success: true
        };

        res.json(response);
      } catch (error) {
        console.error('Erro ao buscar presença:', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }
    });

    this.router.post('/users/bulk', (req, res) => {
      const { userIds } = req.body;
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'userIds deve ser um array' });
      }
      const presences = this.presenceManager.getPresences(userIds);
      res.json(presences);
    });

    this.router.get('/status', (req, res) => {
      res.json({ status: 'online' });
    });
  }

  getRouter() {
    return this.router;
  }
}
