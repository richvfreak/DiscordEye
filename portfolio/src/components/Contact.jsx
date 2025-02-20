import { motion } from 'framer-motion';
import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';

function Contact() {
    return (
        <section className="py-20" id="contact">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto px-4 text-center"
            >
                <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                    Contato
                </h2>
                <p className="text-gray-400 text-lg mb-8">
                    Interessado em trabalhar juntos? Vamos conversar!
                </p>
                <div className="flex justify-center space-x-6">
                    <ContactLink
                        href="mailto:soldego@riseup.net"
                        icon={<FaEnvelope />}
                        label="Email"
                    />
                    <ContactLink
                        href="https://github.com/richvfreak"
                        icon={<FaGithub />}
                        label="GitHub"
                    />
                    <ContactLink
                        href="https://linkedin.com/in/seu-usuario"
                        icon={<FaLinkedin />}
                        label="LinkedIn"
                    />
                </div>
            </motion.div>
        </section>
    );
}

function ContactLink({ href, icon, label }) {
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="text-2xl mb-2">{icon}</span>
            <span className="text-sm">{label}</span>
        </motion.a>
    );
}

export default Contact;
