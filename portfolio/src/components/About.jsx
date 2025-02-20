import { motion } from 'framer-motion';

function About() {
    return (
        <section className="py-20" id="about">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto px-4"
            >
                <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                    Sobre Mim
                </h2>
                <p className="text-gray-400 text-lg mb-6">
                    Olá! Sou um desenvolvedor apaixonado por criar soluções inovadoras. 
                    Minha jornada na programação começou com a curiosidade de entender como as coisas funcionam,
                    e desde então venho construindo projetos que fazem a diferença.
                </p>
                <p className="text-gray-400 text-lg">
                    Atualmente, foco em desenvolvimento web, usando tecnologias modernas 
                    como React, Node.js e APIs REST. Sempre buscando aprender algo novo e 
                    enfrentar desafios interessantes.
                </p>
            </motion.div>
        </section>
    );
}

export default About;
