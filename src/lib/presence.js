import { EventEmitter } from 'events';

export class PresenceManager extends EventEmitter {
    constructor(databaseManager) {
        super();
        this.presences = new Map();
        this.presenceHistory = new Map();
        this.activityStats = new Map();
        this.lastStatusChange = new Map();
        this.maxHistoryPerUser = 50;
        this.cleanupInterval = 24 * 60 * 60 * 1000;
        this.db = databaseManager;

        setInterval(() => this.cleanupOldData(), this.cleanupInterval);
    }

    async updatePresence(newPresence) {
        const userId = newPresence.userId || newPresence.user?.id;
        if (!userId) {
            console.error('ERRO: Não foi possível identificar o ID do usuário');
            return;
        }

        const currentPresence = this.presences.get(userId) || {};
        const timestamp = Date.now();

        if (currentPresence.status !== newPresence.status) {
            await this.recordStatusChange(userId, currentPresence.status, newPresence.status, timestamp);
        }

        await this.processActivities(userId, currentPresence.activities, newPresence.activities, timestamp);

        const updatedPresence = {
            userId,
            username: newPresence.user?.username ||
                newPresence.username ||
                currentPresence.username ||
                '',
            discriminator: newPresence.user?.discriminator ||
                currentPresence.discriminator ||
                '0000',
            globalName: newPresence.user?.globalName ||
                currentPresence.globalName ||
                '',
            displayName: newPresence.user?.displayName ||
                currentPresence.displayName ||
                '',
            avatar: newPresence.user?.avatar ||
                currentPresence.avatar,
            status: newPresence.status || currentPresence.status || 'offline',
            activities: this.normalizeActivities(newPresence.activities) || [],
            clientStatus: newPresence.clientStatus || {},
            platforms: {
                web: newPresence.clientStatus?.web === 'online',
                desktop: newPresence.clientStatus?.desktop === 'online',
                mobile: newPresence.clientStatus?.mobile === 'online'
            },
            lastUpdate: timestamp
        };

        this.presences.set(userId, updatedPresence);
        
        // Salvar no Supabase
        if (this.db) {
            await this.db.savePresence(updatedPresence);
        }

        this.emit('presenceUpdate', currentPresence, updatedPresence);
    }

    normalizeActivities(activities = []) {
        return activities.map(activity => ({
            name: activity.name,
            type: activity.type,
            details: activity.details || null,
            state: activity.state || null,
            timestamps: activity.timestamps || null,
            applicationId: activity.applicationId || null,
            assets: activity.assets ? {
                largeImage: activity.assets.largeImage || null,
                largeText: activity.assets.largeText || null,
                smallImage: activity.assets.smallImage || null,
                smallText: activity.assets.smallText || null
            } : null,
            startedAt: activity.timestamps?.start || null,
            endedAt: activity.timestamps?.end || null
        }));
    }

    async recordStatusChange(userId, oldStatus, newStatus, timestamp) {
        if (!this.presenceHistory.has(userId)) {
            this.presenceHistory.set(userId, []);
        }

        const history = this.presenceHistory.get(userId);
        const lastChange = this.lastStatusChange.get(userId);

        if (lastChange) {
            const duration = timestamp - lastChange;
            await this.updateStatusStats(userId, oldStatus || 'offline', duration);
        }

        const statusChange = {
            timestamp,
            oldStatus: oldStatus || 'offline',
            newStatus: newStatus || 'offline'
        };

        history.unshift(statusChange);

        if (history.length > this.maxHistoryPerUser) {
            history.pop();
        }

        // Salvar no Supabase
        if (this.db) {
            await this.db.saveStatusChange(userId, oldStatus || 'offline', newStatus || 'offline', timestamp);
        }

        this.lastStatusChange.set(userId, timestamp);
    }

    async processActivities(userId, oldActivities = [], newActivities = [], timestamp) {
        if (!this.activityStats.has(userId)) {
            this.activityStats.set(userId, new Map());
        }

        const userStats = this.activityStats.get(userId);

        for (const oldActivity of (oldActivities || [])) {
            const stillActive = newActivities?.some(
                newActivity => newActivity.name === oldActivity.name
            );

            if (!stillActive && oldActivity.timestamps?.start) {
                const duration = timestamp - oldActivity.timestamps.start;
                await this.updateActivityStats(userId, oldActivity.name, duration);
            }
        }

        newActivities?.forEach(activity => {
            if (!activity.timestamps?.start) {
                activity.timestamps = { start: timestamp };
            }
        });
    }

    async updateStatusStats(userId, status, duration) {
        if (!this.activityStats.has(userId)) {
            this.activityStats.set(userId, new Map());
        }

        const stats = this.activityStats.get(userId);
        const currentStats = stats.get(status) || { totalTime: 0, count: 0 };

        const updatedStats = {
            totalTime: currentStats.totalTime + duration,
            count: currentStats.count + 1
        };

        stats.set(status, updatedStats);
    }

    async updateActivityStats(userId, activityName, duration) {
        const stats = this.activityStats.get(userId);
        const currentStats = stats.get(activityName) || {
            totalTime: 0,
            count: 0,
            lastSeen: null
        };

        const updatedStats = {
            totalTime: currentStats.totalTime + duration,
            count: currentStats.count + 1,
            lastSeen: Date.now()
        };

        stats.set(activityName, updatedStats);
    }

    async getPresence(userId) {
        const cachedPresence = this.presences.get(userId);
        if (cachedPresence) return cachedPresence;

        if (this.db) {
            const history = await this.db.getPresenceHistory(userId, 1);
            if (history && history.length > 0) {
                const lastPresence = history[0];
                return {
                    userId,
                    status: lastPresence.status,
                    platforms: {
                        web: lastPresence.platform_web,
                        desktop: lastPresence.platform_desktop,
                        mobile: lastPresence.platform_mobile
                    },
                    lastUpdate: new Date(lastPresence.timestamp).getTime()
                };
            }
        }

        return {
            userId,
            status: 'offline',
            activities: [],
            platforms: { web: false, desktop: false, mobile: false }
        };
    }

    async getPresenceHistory(userId, limit = 10) {
        const cachedHistory = this.presenceHistory.get(userId);
        
        if ((!cachedHistory || cachedHistory.length < limit) && this.db) {
            const dbHistory = await this.db.getPresenceHistory(userId, limit);
            return dbHistory.map(entry => ({
                timestamp: new Date(entry.timestamp).getTime(),
                status: entry.status,
                platforms: {
                    web: entry.platform_web,
                    desktop: entry.platform_desktop,
                    mobile: entry.platform_mobile
                }
            }));
        }

        return (cachedHistory || []).slice(0, limit);
    }

    getActivityStats(userId) {
        return Array.from(this.activityStats.get(userId) || new Map()).map(([name, stats]) => ({
            name,
            ...stats
        }));
    }

    async getUserStats(userId) {
        if (this.db) {
            const dbStats = await this.db.getUserStats(userId);
            if (dbStats) {
                return {
                    ...dbStats,
                    currentStatus: (await this.getPresence(userId)).status,
                    currentActivities: (await this.getPresence(userId)).activities || []
                };
            }
        }

        const presence = await this.getPresence(userId);
        const activityStats = this.getActivityStats(userId);
        const statusHistory = await this.getPresenceHistory(userId);

        return {
            currentStatus: presence.status,
            platforms: presence.platforms,
            currentActivities: presence.activities,
            activityStats: activityStats,
            statusHistory: statusHistory,
            lastUpdate: presence.lastUpdate
        };
    }

    getPresences(userIds) {
        return userIds.map(userId => this.getPresence(userId));
    }

    getAllPresences() {
        return Array.from(this.presences.values());
    }

    getOnlineUsers() {
        return this.getAllPresences().filter(p => p.status !== 'offline');
    }

    getUsersByStatus(status) {
        return this.getAllPresences().filter(p => p.status === status);
    }

    getUsersByActivity(activityName) {
        return this.getAllPresences().filter(p =>
            p.activities.some(a => a.name === activityName)
        );
    }

    async getGlobalStats() {
        if (this.db) {
            const dbStats = await this.db.getGlobalStats();
            if (dbStats) return dbStats;
        }

        const allPresences = await this.getAllPresences();
        const now = Date.now();

        return {
            totalUsers: allPresences.length,
            statusCounts: {
                online: (await this.getUsersByStatus('online')).length,
                idle: (await this.getUsersByStatus('idle')).length,
                dnd: (await this.getUsersByStatus('dnd')).length,
                offline: (await this.getUsersByStatus('offline')).length
            },
            platformCounts: {
                web: allPresences.filter(p => p.platforms.web).length,
                desktop: allPresences.filter(p => p.platforms.desktop).length,
                mobile: allPresences.filter(p => p.platforms.mobile).length
            },
            topActivities: await this.getTopActivities(10),
            lastUpdate: now
        };
    }

    getTopActivities(limit = 10) {
        const activityCounts = new Map();

        this.getAllPresences().forEach(presence => {
            presence.activities.forEach(activity => {
                const count = activityCounts.get(activity.name) || 0;
                activityCounts.set(activity.name, count + 1);
            });
        });

        return Array.from(activityCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    async cleanupOldData() {
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; 

        this.presenceHistory.forEach((history, userId) => {
            const filteredHistory = history.filter(
                entry => now - entry.timestamp < maxAge
            );
            if (filteredHistory.length === 0) {
                this.presenceHistory.delete(userId);
            } else {
                this.presenceHistory.set(userId, filteredHistory);
            }
        });

        this.activityStats.forEach((stats, userId) => {
            stats.forEach((activityStats, activity) => {
                if (now - activityStats.lastSeen > maxAge) {
                    stats.delete(activity);
                }
            });
            if (stats.size === 0) {
                this.activityStats.delete(userId);
            }
        });

        this.presences.forEach((presence, userId) => {
            if (now - presence.lastUpdate > maxAge) {
                this.presences.delete(userId);
            }
        });
    }
}
