import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import { 
    FaCircle, 
    FaDesktop, 
    FaGlobe, 
    FaMobile, 
    FaSpotify 
} from 'react-icons/fa';

function DiscordStatus() {
    const [status, setStatus] = useState('offline');
    const [activity, setActivity] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [platforms, setPlatforms] = useState({
        web: false,
        desktop: false,
        mobile: false
    });

    useEffect(() => {
        const socket = io('wss://discord-presence-api.onrender.com', {
            transports: ['websocket'],
            upgrade: false,
            withCredentials: false
        });
        
        socket.on('connect', () => {
            setIsConnected(true);
            setError(null);
            socket.emit('subscribe', '399547557883281419');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Carregar status inicial
        fetch('https://discord-presence-api.onrender.com/api/users/399547557883281419')
            .then(res => res.json())
            .then(response => {
                console.log('DEBUG: Resposta da API completa:', response);
                
                const { data } = response;
                console.log('DEBUG: Dados do usuário recebidos:', {
                    username: data.discord_user.username,
                    discriminator: data.discord_user.discriminator,
                    globalName: data.discord_user.global_name,
                    displayName: data.discord_user.display_name
                });
                
                setUserData(data.discord_user);
                setStatus(data.discord_status);
                setActivity(data.activities?.[0]);
                setPlatforms({
                    web: data.active_on_discord_web,
                    desktop: data.active_on_discord_desktop,
                    mobile: data.active_on_discord_mobile
                });
            })
            .catch(err => {
                console.error('Erro ao buscar status:', err);
                setError('Não foi possível carregar o status');
            });

        socket.on('presenceUpdate', (updatedPresence) => {
            console.log('DEBUG: Dados do usuário atualizados:', {
                username: updatedPresence.discord_user.username,
                discriminator: updatedPresence.discord_user.discriminator,
                globalName: updatedPresence.discord_user.global_name,
                displayName: updatedPresence.discord_user.display_name
            });
            
            setUserData(updatedPresence.discord_user);
            setStatus(updatedPresence.discord_status);
            setActivity(updatedPresence.activities?.[0]);
            setPlatforms({
                web: updatedPresence.active_on_discord_web,
                desktop: updatedPresence.active_on_discord_desktop,
                mobile: updatedPresence.active_on_discord_mobile
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'idle': return 'bg-yellow-500';
            case 'dnd': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const renderActivity = () => {
        if (!activity) return null;

        return (
            <div className="text-sm text-gray-300 mt-1 truncate">
                {activity.name === 'Custom Status' 
                    ? activity.state 
                    : `${activity.name} - ${activity.details || ''}`}
            </div>
        );
    };

    const renderPlatformIcons = () => {
        return (
            <div className="flex space-x-2 mt-2">
                {platforms.web && <FaGlobe className="text-blue-400" title="Online na Web" />}
                {platforms.desktop && <FaDesktop className="text-green-400" title="Online no Desktop" />}
                {platforms.mobile && <FaMobile className="text-purple-400" title="Online no Mobile" />}
            </div>
        );
    };

    if (error) return null;

    return (
        <motion.div 
            className="fixed bottom-4 right-4 bg-[#1a1a1a] rounded-lg p-4 shadow-lg text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
        >
            <div className="flex items-center">
                <div className="relative mr-3">
                    {userData?.avatar ? (
                        <img 
                            src={`https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`} 
                            alt="Avatar" 
                            className="w-12 h-12 rounded-full"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                    )}
                    <FaCircle 
                        className={`absolute bottom-0 right-0 text-sm ${getStatusColor()} rounded-full`} 
                    />
                </div>
                <div>
                    <div className="font-semibold">
                        {userData?.global_name || userData?.username || ''}
                    </div>
                    {renderActivity()}
                    {renderPlatformIcons()}
                </div>
            </div>
        </motion.div>
    );
}

export default DiscordStatus;
