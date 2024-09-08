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
      <h2 className="text-3xl font-bold mb-8">
        <TypewriterEffect text="Academics" speed={100} loop={true} />
      </h2>
      {academics.map((exp, index) => (
        <motion.div
          key={index}
          className="mb-8 bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="flex items-center mb-4">
            <img src={exp.logo} alt={`${exp.company} logo`} className="w-16 h-16 mr-4 object-contain" />
            <div>
              <h3 className="text-2xl font-semibold">{exp.company}</h3>
              <p className="text-xl text-gray-600">{exp.position}</p>
              <p className="text-gray-500">{exp.duration}</p>
            </div>
          </div>
          <p className="text-gray-700">{exp.description}</p>
        </motion.div>
      ))}
    </motion.section>
  );
};

export default AcademicSection;