import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const ExperienceSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleArtifacts, setVisibleArtifacts] = useState([]);

  const experiences = [
    {
      company: 'PhonePe',
      position: 'Software Engineer',
      duration: 'May 2023 - Present',
      description: 'Engineered TStore (Transaction Store), the high-performance post payment persistence platform at PhonePe, scaling 300M+ transactions daily with 99.99% availability serving 570+ million users, guaranteeing latency sensitive Transaction APIs (SLO p99 < 100ms, p50 < 5ms, 200K RPS).',
      logo: '/images/phonepe-logo.jpeg',
      artifacts: ['/images/tstore1.png', '/images/tstore2.png']
    },
    {
      company: 'Google',
      position: 'Software Engineer',
      duration: 'September 2021 - May 2023',
      description: 'Engineered Google Cloud Directory Sync, the leading sync tool used by 20K+ Workspace, GCP, Android and Chrome enterprise customers. Designed, implemented and launched Identity Sync Analytics Pipeline to analyse the customer usage of Cloud Identity Platform.',
      logo: '/images/google-logo.jpeg',
      artifacts: ['/images/google-cloud-fundamentals.png', '/images/apis-explorer-cloud-storage.png']
    },
    {
      company: 'Flipkart',
      position: 'Software Development Engineer II',
      duration: 'February 2021 - September 2021',
      description: 'Tech lead of the platform team responsible for charting key platform consolidation, new use case adoptions, scalability, KTLO etc. Designed and built Atlas SLA Governance for NPS impact of network changes on EKart LO metrics such as SLA/Breach/Precision and NPS.',
      logo: '/images/flipkart-logo.png',
      artifacts: ['/images/placeholder.svg']
    },
    {
      company: 'Flipkart',
      position: 'Software Development Engineer I',
      duration: 'July 2019 - January 2021',
      description: 'Worked on various projects in the Supply Chain Engineering team, focusing on optimizing delivery processes and improving customer experience.',
      logo: '/images/flipkart-logo.png',
      artifacts: ['/images/placeholder.svg']
    },
  ];

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const displayedExperiences = isExpanded ? experiences : experiences.slice(0, 3);

  const openImageInNewTab = (imageSrc) => {
    window.open(imageSrc, '_blank');
  };

  useEffect(() => {
    const animateArtifacts = () => {
      displayedExperiences.forEach((exp, index) => {
        exp.artifacts.forEach((artifact, artifactIndex) => {
          setTimeout(() => {
            setVisibleArtifacts(prev => [...prev, `${index}-${artifactIndex}`]);
          }, (index * exp.artifacts.length + artifactIndex) * 1000);
        });
      });

      setTimeout(() => {
        setVisibleArtifacts([]);
      }, displayedExperiences.reduce((sum, exp) => sum + exp.artifacts.length, 0) * 1000 + 10000);
    };

    animateArtifacts();
    const intervalId = setInterval(animateArtifacts, (displayedExperiences.reduce((sum, exp) => sum + exp.artifacts.length, 0) * 1000) + 10000);

    return () => clearInterval(intervalId);
  }, [displayedExperiences]);

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
            className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
              <img src={exp.logo} alt={`${exp.company} logo`} className="w-16 h-16 mr-4 object-contain rounded-full shadow-sm" />
              <div>
                <h3 className="text-xl font-semibold">{exp.company}</h3>
                <p className="text-md text-gray-600 dark:text-gray-300">{exp.position}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{exp.duration}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <TypewriterEffect text={exp.description} speed={10} loop={true} hideCursorOnComplete={true} />
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              {exp.artifacts.map((artifact, artifactIndex) => (
                <motion.div
                  key={`${index}-${artifactIndex}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: visibleArtifacts.includes(`${index}-${artifactIndex}`) ? 1 : 0,
                    x: visibleArtifacts.includes(`${index}-${artifactIndex}`) ? 0 : -20
                  }}
                  transition={{ duration: 0.5 }}
                  className="relative group"
                >
                  <img
                    src={artifact}
                    alt={`${exp.company} artifact ${artifactIndex + 1}`}
                    className="w-24 h-24 object-cover rounded-md cursor-pointer transition-transform hover:scale-105 border-4 border-gray-200 dark:border-gray-700 shadow-lg"
                    onClick={() => openImageInNewTab(artifact)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs">Click to enlarge</span>
                  </div>
                </motion.div>
              ))}
            </div>
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
