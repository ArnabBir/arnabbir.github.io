import React from 'react';
import { motion } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const OpenSourceProjects = () => {
  const projects = [
    {
      title: 'HUIM-ACO',
      description: 'High Utility Itemset Mining using Ant Colony Optimization',
      url: 'https://github.com/ArnabBir/huim-aco',
    },
    {
      title: 'Scalable Matrix Computation',
      description: 'Efficient algorithms for large-scale matrix operations',
      url: 'https://github.com/ArnabBir/scalable-matrix-computation',
    },
    {
      title: 'IIKH (Interactive Intelligent Kitchen Helper)',
      description: 'An AI-powered kitchen assistant application',
      url: 'https://github.com/ArnabBir/IIKH',
    },
  ];

  return (
    <motion.section
      id="projects"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-8">
        <TypewriterEffect text="Open Source Projects" speed={100} loop={true} pause={30000} />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col transform hover:-translate-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="p-6 flex-grow">
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{project.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-justify">{project.description}</p>
            </div>
            <div className="p-6 pt-0">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 text-center"
              >
                View on GitHub
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default OpenSourceProjects;