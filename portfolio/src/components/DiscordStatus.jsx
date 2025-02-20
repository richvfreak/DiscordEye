import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DiscordStatus = () => {
    const [userData, setUserData] = useState({
        username: 'Usuário',
        avatar: null,
        status: 'offline',
        activities: []
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = '399547557883281419';
                const response = await axios.get(`https://discord-presence-api.onrender.com/api/users/${userId}`);
                
                console.log('DEBUG: Resposta da API completa:', response.data);
                
                if (response.data.success) {
                    const { discord_user, discord_status, activities } = response.data.data;
                    
                    console.log('DEBUG: Dados do usuário recebidos:', {
                        username: discord_user.username,
                        discriminator: discord_user.discriminator,
                        globalName: discord_user.global_name,
                        displayName: discord_user.display_name
                    });

                    setUserData({
                        username: discord_user.username || discord_user.global_name || 'Usuário',
                        avatar: discord_user.avatar ? 
                            `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.png` : 
                            null,
                        status: discord_status,
                        activities: activities
                    });
                }
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error);
            }
        };

        fetchUserData();
        const intervalId = setInterval(fetchUserData, 60000); // Atualizar a cada minuto

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="discord-status">
            {userData.avatar && (
                <img 
                    src={userData.avatar} 
                    alt={`${userData.username}'s avatar`} 
                    className="discord-avatar" 
                />
            )}
            <div className="discord-user-info">
                <p>Username: {userData.username}</p>
                <p>Status: {userData.status}</p>
                {userData.activities.length > 0 && (
                    <div className="discord-activities">
                        <p>Atividades:</p>
                        {userData.activities.map((activity, index) => (
                            <p key={index}>{activity.name}</p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiscordStatus;
