import { motion } from 'framer-motion';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

function Projects() {
    const projects = [
        {
            title: 'Discord Presence API',
            description: 'API para expor status do Discord em tempo real usando WebSocket e REST.',
            tech: ['Node.js', 'Express', 'WebSocket', 'Discord.js'],
            github: 'https://github.com/richvfreak/discord-presence-api',
            live: 'https://discord-presence-api.onrender.com'
        },
        // Adicione mais projetos aqui
    ];

    return (
        <section className="py-20" id="projects">
            <div className="max-w-6xl mx-auto px-4">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text"
                >
                    Projetos
                </motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {projects.map((project, index) => (
                        <ProjectCard key={index} project={project} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ProjectCard({ project, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-[#1a1a1a] rounded-lg p-6 hover:bg-[#252525] transition-colors"
        >
            <h3 className="text-2xl font-semibold mb-3">{project.title}</h3>
            <p className="text-gray-400 mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.map((tech, i) => (
                    <span
                        key={i}
                        className="px-3 py-1 bg-[#2a2a2a] rounded-full text-sm text-gray-300"
                    >
                        {tech}
                    </span>
                ))}
            </div>
            <div className="flex gap-4">
                <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <FaGithub size={20} />
                </a>
                <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <FaExternalLinkAlt size={20} />
                </a>
            </div>
        </motion.div>
    );
}

export default Projects;
