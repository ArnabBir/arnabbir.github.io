import React from 'react';
import { motion } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const AcademicSection = () => {
  const academics = [
    {
      company: 'Indian Institute of Technology Kharagpur',
      position: <TypewriterEffect text="Integrated Bachelor's and Master's of Science in Mathematics and Computing" speed={100} loop={true} /> ,
      duration: <TypewriterEffect text="'2014 - 2019'" speed={100} loop={true} /> ,
      description: <TypewriterEffect text="GPA 8.67 | Class Rank 4" speed={100} loop={true} /> ,
      logo: '/images/iitkgp.jpg'
    }
  ];

  return (
    <motion.section
      id="academics"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6">
        <TypewriterEffect text="Academics" speed={100} loop={true}  pause={30000} />
      </h2>
      {academics.map((exp, index) => (
        <motion.div
          key={index}
          className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="flex items-center mb-3">
            <img src={exp.logo} alt={`${exp.company} logo`} className="w-12 h-12 mr-3 object-contain rounded-full shadow-sm" />
            <div>
              <h3 className="text-lg font-semibold">{exp.company}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{exp.position}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{exp.duration}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{exp.description}</p>
        </motion.div>
      ))}
    </motion.section>
  );
};

export default AcademicSection;