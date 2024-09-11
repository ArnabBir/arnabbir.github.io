import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const ExperienceSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const experiences = [
    {
      company: 'PhonePe',
      position: 'Software Engineer',
      duration: 'May 2023 - Present',
      description: 'Engineered TStore (Transaction Store), the high-performance post payment persistence platform at PhonePe, scaling 300M+ transactions daily with 99.99% availability serving 570+ million users, guaranteeing latency sensitive Transaction APIs (SLO p99 < 100ms, p50 < 5ms, 200K RPS).',
      logo: '/images/phonepe-logo.jpeg'
    },
    {
      company: 'Google',
      position: 'Software Engineer',
      duration: 'September 2021 - May 2023',
      description: 'Engineered Google Cloud Directory Sync, the leading sync tool used by 20K+ Workspace, GCP, Android and Chrome enterprise customers. Designed, implemented and launched Identity Sync Analytics Pipeline to analyse the customer usage of Cloud Identity Platform.',
      logo: '/images/google-logo.jpeg'
    },
    {
      company: 'Flipkart',
      position: 'Software Development Engineer II',
      duration: 'February 2021 - September 2021',
      description: 'Tech lead of the platform team responsible for charting key platform consolidation, new use case adoptions, scalability, KTLO etc. Designed and built Atlas SLA Governance for NPS impact of network changes on EKart LO metrics such as SLA/Breach/Precision and NPS.',
      logo: '/images/flipkart-logo.png'
    },
    {
      company: 'Flipkart',
      position: 'Software Development Engineer I',
      duration: 'July 2019 - January 2021',
      description: 'Worked on various projects in the Supply Chain Engineering team, focusing on optimizing delivery processes and improving customer experience.',
      logo: '/images/flipkart-logo.png'
    },
    // Add more experiences here if needed
  ];

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const displayedExperiences = isExpanded ? experiences : experiences.slice(0, 3);

  return (
    <motion.section
      id="experience"
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-6">
        <TypewriterEffect text="Professional Experience" speed={100} loop={true} pause={30000} hideCursorOnComplete={true} />
      </h2>
      <AnimatePresence>
        {displayedExperiences.map((exp, index) => (
          <motion.div
            key={index}
            className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
              <TypewriterEffect text={exp.description} speed={10} loop={true} hideCursorOnComplete={true} />
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
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

export default ExperienceSection;