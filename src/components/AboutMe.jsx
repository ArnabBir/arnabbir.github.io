import React from 'react';
import { motion } from 'framer-motion';
import TypewriterEffect from './TypewriterEffect';

const AboutMe = () => {
  return (
    <motion.section
      id="about"
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-4">
        <TypewriterEffect text="About Me" speed={100} loop={true} pause={30000} hideCursorOnComplete={true} />
      </h2>
      <div className="h-32 overflow-y-auto text-justify bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm mb-4">
          <TypewriterEffect 
            text="I am a passionate Software Engineer with experience working at leading tech companies such as PhonePe, Google, and Flipkart. My expertise lies in developing scalable and efficient solutions for complex problems. I am dedicated to continuous learning and sharing knowledge through tech blogs and community engagement. With a strong foundation in computer science and a keen interest in emerging technologies, I strive to contribute to innovative projects that make a significant impact in the tech industry." 
            speed={10} 
            loop={true} 
            pause={10000}
            hideCursorOnComplete={true}
          />
        </p>
      </div>
    </motion.section>
  );
};

export default AboutMe;