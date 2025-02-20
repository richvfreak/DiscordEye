import express from 'express';

export class ApiManager {
  constructor(presenceManager) {
    this.presenceManager = presenceManager;
  }

  getRouter() {
    const router = express.Router();

    router.get('/users/:userId', (req, res) => {
      console.log('Requisição recebida para usuário:', req.params.userId);
      const presence = this.presenceManager.getPresence(req.params.userId);
      console.log('Presença retornada:', presence);
      res.json(presence);
    });

    router.post('/users/bulk', (req, res) => {
      const { userIds } = req.body;
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'userIds deve ser um array' });
      }
      const presences = this.presenceManager.getPresences(userIds);
      res.json(presences);
    });

    router.get('/status', (req, res) => {
      res.json({ status: 'online' });
    });

    return router;
  }
}
