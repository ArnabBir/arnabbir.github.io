import React from 'react';
import { motion } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const AboutMe = () => {
  return (
    <motion.section
      id="about"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-8">
        <TypewriterEffect text="About Me" speed={100} loop={true} />
      </h2>
      <p className="text-xl mb-4">
      <TypewriterEffect text="I am a passionate Software Engineer with experience working at leading tech companies such as PhonePe, Google, and Flipkart. My expertise lies in developing scalable and efficient solutions for complex problems. I am dedicated to continuous learning and sharing knowledge through tech blogs and community engagement. With a strong foundation in computer science and a keen interest in emerging technologies, I strive to contribute to innovative projects that make a significant impact in the tech industry." speed={10} loop={true} />
      </p>
    </motion.section>
  );
};

export default AboutMe;