import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

function Hero() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <motion.h1
                    className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text"
                    whileHover={{ scale: 1.05 }}
                >
                    Richard
                </motion.h1>
                <motion.p
                    className="text-xl text-gray-400 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Desenvolvedor de Sistemas
                </motion.p>
                <motion.div
                    className="flex space-x-4 justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <SocialLink href="https://github.com/richvfreak" icon={<FaGithub />} />
                    <SocialLink href="https://linkedin.com/in/seu-usuario" icon={<FaLinkedin />} />
                    <SocialLink href="https://twitter.com/chakrarest" icon={<FaTwitter />} />
                </motion.div>
            </motion.div>
        </div>
    );
}

function SocialLink({ href, icon }) {
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white text-2xl transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
        >
            {icon}
        </motion.a>
    );
}

export default Hero;
