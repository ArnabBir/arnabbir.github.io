import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';
import { Link } from 'react-router-dom';

const Projects = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const projects = [
    {
      title: "Prortfolio Hub",
      description: "Track, Grow and Retire Early.",
      link: "/portfoliohub"
    },
    {
      title: "Hello World",
      description: "A simple Hello World project with a typewriter effect.",
      link: "/hello-world"
    },
    {
      title: "Happy Birthday",
      description: "A birthday greeting project with animations.",
      link: "/happy-birthday"
    },
    {
      title: "Good Night",
      description: "A soothing good night message with a starry background.",
      link: "/good-night"
    },
    {
      title: "Motivational Quotes",
      description: "A collection of inspiring quotes with dynamic backgrounds.",
      link: "/motivational-quotes"
    }
  ];

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const displayedProjects = isExpanded ? projects : projects.slice(0, 3);

  return (
    <motion.section
      id="projects"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-8">
        <TypewriterEffect text="Projects" speed={100} loop={true} pause={30000} hideCursorOnComplete={true} />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {displayedProjects.map((project, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="p-6 flex-grow">
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{project.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
              </div>
              <div className="p-6 pt-0">
                <Link
                  to={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 text-center"
                >
                  Check it out
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={toggleExpand}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300 text-sm font-semibold"
        >
          {isExpanded ? "Collapse" : "Explore More"}
        </button>
      </div>
    </motion.section>
  );
};

export default Projects;