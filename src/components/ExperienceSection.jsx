import React from 'react';
import { motion } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const ExperienceSection = () => {
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
    }
  ];

  return (
    <motion.section
      id="experience"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8">
        <TypewriterEffect text="Professional Experience" speed={100} loop={true} />
      </h2>
      {experiences.map((exp, index) => (
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

export default ExperienceSection;