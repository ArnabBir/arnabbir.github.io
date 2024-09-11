import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const CertificationsSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const certifications = [
    {
      title: "Introduction to Google Workspace Administration",
      issuer: "Google Cloud",
      date: "Sep 25, 2022",
      image: "/images/google-workspace-admin.png"
    },
    {
      title: "APIs Explorer: Cloud Storage",
      issuer: "Google Cloud",
      date: "Apr 12, 2022",
      image: "/images/apis-explorer-cloud-storage.png"
    },
    {
      title: "Java Programming: Solving Problems with Software",
      issuer: "Duke University",
      date: "Apr 30, 2022",
      image: "/images/java-programming-duke.png"
    },
    {
      title: "Google Cloud Fundamentals: Core Infrastructure",
      issuer: "Google Cloud",
      date: "Mar 19, 2022",
      image: "/images/google-cloud-fundamentals.png"
    },
    {
      title: "Securing and Integrating Components of your Application",
      issuer: "Google Cloud",
      date: "Feb 12, 2023",
      image: "/images/securing-integrating-components.png"
    },
    {
      title: "Cloud Functions: Qwik Start - Console",
      issuer: "Google Cloud",
      date: "Jun 9, 2022",
      image: "/images/cloud-functions-qwik-start.png"
    },
    {
      title: "Getting Started With Application Development",
      issuer: "Google Cloud",
      date: "Nov 5, 2022",
      image: "/images/getting-started-app-dev.png"
    }
  ];

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const displayedCertifications = isExpanded ? certifications : certifications.slice(0, 4);

  return (
    <motion.section
      id="certifications"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-8">
        <TypewriterEffect text="Certifications" speed={100} loop={true} pause={30000} hideCursorOnComplete={true} />
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {displayedCertifications.map((cert, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <a href={cert.image} target="_blank" rel="noopener noreferrer">
                <img src={cert.image} alt={cert.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{cert.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{cert.issuer}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{cert.date}</p>
                </div>
              </a>
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

export default CertificationsSection;
