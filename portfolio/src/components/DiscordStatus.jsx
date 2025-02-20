import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDiscord, FaGamepad, FaSpotify } from 'react-icons/fa';
import io from 'socket.io-client';

function DiscordStatus() {
    const [status, setStatus] = useState(null);
    const [activity, setActivity] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

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
            setError('Desconectado do servidor');
        });

        socket.on('connect_error', () => {
            setIsConnected(false);
            setError('Erro ao conectar');
        });

        socket.on('presenceUpdate', (data) => {
            setStatus(data.status);
            setActivity(data.activities?.[0]);
            setError(null);
        });

        // Carregar status inicial
        fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://discord-presence-api.onrender.com/api/users/399547557883281419'))
            .then(res => res.json())
            .then(response => {
                const data = JSON.parse(response.contents);
                setStatus(data.status);
                setActivity(data.activities?.[0]);
                setError(null);
            })
            .catch(() => {
                setError('Erro ao carregar status');
            });

        return () => socket.disconnect();
    }, []);

    const statusColors = {
        online: 'bg-green-500',
        idle: 'bg-yellow-500',
        dnd: 'bg-red-500',
        offline: 'bg-gray-500'
    };

    const activityIcon = activity?.type === 'PLAYING' ? <FaGamepad /> : <FaSpotify />;

    return (
        <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <motion.div
                className={`bg-[#2f3136] rounded-lg shadow-lg cursor-pointer
                    ${isExpanded ? 'w-64' : 'w-12'} overflow-hidden`}
                animate={{ width: isExpanded ? 256 : 48 }}
            >
                <div className="p-3 flex items-center">
                    <div className="relative">
                        <FaDiscord className="w-6 h-6 text-[#7289da]" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full
                            ${statusColors[status] || 'bg-gray-500'} border-2 border-[#2f3136]`} />
                    </div>
                    
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="ml-3"
                            >
                                <div className="text-sm font-medium text-white">
                                    {error || `Status: ${status || 'Carregando...'}`}
                                </div>
                                {activity && (
                                    <div className="text-xs text-gray-400 flex items-center mt-1">
                                        {activityIcon}
                                        <span className="ml-1">{activity.name}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default DiscordStatus;
