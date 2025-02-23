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

        const spotifyActivity = presenceData.activities?.find(
          activity => activity.name === 'Spotify'
        );

        const response = {
  success: true,
  data: {
    active_on_discord_mobile: presenceData.activeOnMobile || false,
    active_on_discord_desktop: presenceData.activeOnDesktop || false,
    active_on_discord_web: presenceData.activeOnWeb || false,
    listening_to_spotify: !!spotifyActivity,
    kv: {}, // Placeholder para dados personalizados
    spotify: spotifyActivity ? {
      track_id: spotifyActivity.sync_id,
      timestamps: spotifyActivity.timestamps,
      song: spotifyActivity.details,
      artist: spotifyActivity.state,
      album_art_url: spotifyActivity.assets?.large_image
        ? `https://i.scdn.co/image/${spotifyActivity.assets.large_image.replace('spotify:', '')}`
        : null,
      album: spotifyActivity.assets?.large_text
    } : null,
    discord_user: {
      username: presenceData.username || '',
      discriminator: presenceData.discriminator || '0000',
      id: presenceData.userId,
      avatar: presenceData.avatar,
      public_flags: 0, // Placeholder
      global_name: presenceData.globalName,
      display_name: presenceData.displayName
    },
    discord_status: presenceData.status || 'offline',
    activities: presenceData.activities?.map(activity => ({
      name: activity.name,
      type: activity.type,
      details: activity.details || null,
      state: activity.state || null,
      timestamps: activity.timestamps || null,
      large_image: activity.assets?.large_image 
        ? activity.assets.large_image.startsWith('mp:external/')
          ? `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image.replace('mp:external/', '')}.png`
          : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`
        : null,
      large_text: activity.assets?.large_text || null,
      small_image: activity.assets?.small_image 
        ? `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`
        : null,
      small_text: activity.assets?.small_text || null
    })) || []
  }
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
