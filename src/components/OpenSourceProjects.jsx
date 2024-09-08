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
      <h2 className="text-3xl font-bold mb-8">
        <TypewriterEffect text="Open Source Projects" speed={100} loop={true} />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="p-6 flex-grow">
              <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
              <p className="text-gray-600 mb-4">{project.description}</p>
            </div>
            <div className="p-6 pt-0">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors duration-300 w-full text-center"
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