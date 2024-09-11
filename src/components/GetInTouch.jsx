import React from 'react';
import { motion } from 'framer-motion';
import { FaLinkedin, FaGithub, FaInstagram, FaTwitter, FaFacebook, FaEnvelope } from 'react-icons/fa';
import TypewriterEffect from './TypewriterEffect';

const GetInTouch = () => {
  const socialLinks = [
    { icon: FaLinkedin, url: 'https://www.linkedin.com/in/arnabbir/', label: 'LinkedIn' },
    { icon: FaGithub, url: 'https://github.com/ArnabBir', label: 'GitHub' },
    { icon: FaInstagram, url: 'https://www.instagram.com/arnabbir', label: 'Instagram' },
    { icon: FaTwitter, url: 'https://x.com/arnabbir', label: 'Twitter' },
    { icon: FaFacebook, url: 'https://www.facebook.com/arnab.bir.3', label: 'Facebook' },
    { icon: FaEnvelope, url: 'mailto:arnabbir@gmail.com', label: 'Email' },
  ];

  return (
    <motion.section
      id="contact"
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold mb-8 text-center">
        <TypewriterEffect text="Connect with Me" speed={100} loop={true} />
      </h2>
      <div className="bg-black dark:bg-gray-800 rounded-lg shadow-2xl p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {socialLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center bg-white text-gray-800 dark:bg-gray-700 dark:text-white p-4 rounded-lg hover:bg-green-600 hover:text-white dark:hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <link.icon className="text-4xl mb-2" />
              <span>{link.label}</span>
            </motion.a>
          ))}
        </div>
        <motion.a 
          href="https://topmate.io/arnab_bir"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-red-500 text-white text-center py-3 rounded-lg hover:bg-green-600 transition-colors duration-300 mb-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Book a Session on Topmate
        </motion.a>
        <motion.a 
          href="https://preplaced.in/profile/arnab-bir"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-500 text-white text-center py-3 rounded-lg hover:bg-green-600 transition-colors duration-300 mb-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Book a Session on Preplaced
        </motion.a>
        <motion.a 
          href="https://www.codementor.io/@arnabbir"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-sky-900 text-white text-center py-3 rounded-lg hover:bg-green-600 transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Book a Session on Codementor
        </motion.a>
      </div>
    </motion.section>
  );
};

export default GetInTouch;