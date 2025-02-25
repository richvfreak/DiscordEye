import express from 'express';
import os from 'os';

export class ApiManager {
  constructor(presenceManager) {
    this.presenceManager = presenceManager;
    this.router = express.Router();
    this.startTime = Date.now();
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
            kv: {}, 
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
              public_flags: 0,
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

    this.router.get('/status', async (req, res) => {
      const uptime = Math.floor((Date.now() - this.startTime) / 1000);
      const totalUsers = await this.presenceManager.getAllPresences().length;
      const activeUsers = await this.presenceManager.getAllPresences()
        .filter(p => p.status !== 'offline').length;

      const status = {
        status: 'online',
        version: '1.0',
        uptime: uptime,
        uptime_formatted: this.formatUptime(uptime),
        system: {
          memory: {
            total: Math.floor(os.totalmem() / 1024 / 1024),
            free: Math.floor(os.freemem() / 1024 / 1024),
            usage: Math.floor((1 - os.freemem() / os.totalmem()) * 100)
          },
          cpu_usage: os.loadavg()[0],
          platform: os.platform(),
          arch: os.arch()
        },
        stats: {
          total_users: totalUsers,
          active_users: activeUsers,
          users_online: await this.presenceManager.getAllPresences()
            .filter(p => p.status === 'online').length,
          users_idle: await this.presenceManager.getAllPresences()
            .filter(p => p.status === 'idle').length,
          users_dnd: await this.presenceManager.getAllPresences()
            .filter(p => p.status === 'dnd').length
        }
      };

      res.json(status);
    });
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  getRouter() {
    return this.router;
  }
}
