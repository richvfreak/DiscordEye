import { createClient } from '@supabase/supabase-js';

export class DatabaseManager {
    constructor() {
        this.supabase = null;
        this.connected = false;
        this.batchQueue = {
            presenceHistory: [],
            activities: [],
            statusChanges: []
        };
        this.batchSize = 20;
        this.batchInterval = 60000; 
    }

    async connect(supabaseUrl, supabaseKey) {
        try {
            this.supabase = createClient(supabaseUrl, supabaseKey);
            this.connected = true;
            console.log('Conectado ao Supabase');
            
            this.startBatchProcessing();
            
            return true;
        } catch (error) {
            console.error('Erro ao conectar ao Supabase:', error);
            return false;
        }
    }

    startBatchProcessing() {
        setInterval(() => {
            this.processBatch('presenceHistory');
            this.processBatch('activities');
            this.processBatch('statusChanges');
        }, this.batchInterval);
    }

    async processBatch(queueName) {
        if (!this.connected || this.batchQueue[queueName].length === 0) return;

        const batch = this.batchQueue[queueName].splice(0, this.batchSize);
        
        try {
            let result;
            switch(queueName) {
                case 'presenceHistory':
                    result = await this.supabase
                        .from('presence_history')
                        .insert(batch);
                    break;
                case 'activities':
                    result = await this.supabase
                        .from('activity_logs')
                        .insert(batch);
                    break;
                case 'statusChanges':
                    result = await this.supabase
                        .from('status_changes')
                        .insert(batch);
                    break;
            }
            
            if (result.error) {
                console.error(`Erro ao processar lote de ${queueName}:`, result.error);
                this.batchQueue[queueName].unshift(...batch);
            } else {
                console.log(`Lote de ${queueName} processado com sucesso: ${batch.length} registros`);
            }
        } catch (error) {
            console.error(`Erro ao processar lote de ${queueName}:`, error);
            this.batchQueue[queueName].unshift(...batch);
        }
    }

    async savePresence(presence) {
        if (!this.connected) return false;
        
        const presenceRecord = {
            user_id: presence.userId,
            username: presence.username,
            status: presence.status,
            timestamp: new Date(presence.lastUpdate).toISOString(),
            platform_web: presence.platforms.web,
            platform_desktop: presence.platforms.desktop,
            platform_mobile: presence.platforms.mobile,
            activity_count: presence.activities?.length || 0
        };
        
        this.batchQueue.presenceHistory.push(presenceRecord);
        
        if (presence.activities && presence.activities.length > 0) {
            presence.activities.forEach(activity => {
                const activityRecord = {
                    user_id: presence.userId,
                    activity_name: activity.name,
                    activity_type: activity.type,
                    activity_details: activity.details,
                    activity_state: activity.state,
                    started_at: activity.startedAt ? new Date(activity.startedAt).toISOString() : null,
                    timestamp: new Date(presence.lastUpdate).toISOString()
                };
                
                this.batchQueue.activities.push(activityRecord);
            });
        }
        
        return true;
    }

    async saveStatusChange(userId, oldStatus, newStatus, timestamp) {
        if (!this.connected) return false;
        
        const statusChange = {
            user_id: userId,
            old_status: oldStatus,
            new_status: newStatus,
            timestamp: new Date(timestamp).toISOString()
        };
        
        this.batchQueue.statusChanges.push(statusChange);
        return true;
    }

    async getPresenceHistory(userId, limit = 100) {
        if (!this.connected) return [];
        
        const { data, error } = await this.supabase
            .from('presence_history')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);
            
        if (error) {
            console.error('Erro ao buscar histórico de presença:', error);
            return [];
        }
        
        return data;
    }

    async getActivityHistory(userId, limit = 100) {
        if (!this.connected) return [];
        
        const { data, error } = await this.supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);
            
        if (error) {
            console.error('Erro ao buscar histórico de atividades:', error);
            return [];
        }
        
        return data;
    }

    async getUserStats(userId) {
        if (!this.connected) return null;
        
        try {
            const { data: platformData } = await this.supabase
                .from('presence_history')
                .select('platform_web, platform_desktop, platform_mobile')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false })
                .limit(1);
            
            const { data: statusCounts } = await this.supabase
                .rpc('get_status_counts', { user_id_param: userId });
            
            const { data: topActivities } = await this.supabase
                .rpc('get_top_activities', { user_id_param: userId, limit_param: 5 });
                
            const { data: onlineTime } = await this.supabase
                .rpc('get_online_time', { user_id_param: userId });
                
            return {
                userId,
                platforms: platformData?.[0] ? {
                    web: platformData[0].platform_web,
                    desktop: platformData[0].platform_desktop,
                    mobile: platformData[0].platform_mobile
                } : { web: false, desktop: false, mobile: false },
                statusCounts: statusCounts || [],
                topActivities: topActivities || [],
                onlineTime: onlineTime?.[0]?.online_time || 0
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas do usuário:', error);
            return null;
        }
    }

    async getGlobalStats() {
        if (!this.connected) return null;
        
        try {
            const { count: totalUsers } = await this.supabase
                .from('presence_history')
                .select('user_id', { count: 'exact', head: true })
                .order('timestamp', { ascending: false });
            
            const { data: statusCounts } = await this.supabase
                .rpc('get_global_status_counts');
            
            const { data: topActivities } = await this.supabase
                .rpc('get_global_top_activities', { limit_param: 10 });
                
            return {
                totalUsers,
                statusCounts: statusCounts || [],
                topActivities: topActivities || [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas globais:', error);
            return null;
        }
    }
} 
