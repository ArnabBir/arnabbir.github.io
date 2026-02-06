import React from 'react';
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter, FaFacebook, FaEnvelope, FaHackerrank, FaStackOverflow, FaGlobe } from 'react-icons/fa';
import { SiCodeforces, SiLeetcode, SiSubstack } from 'react-icons/si';

const SocialLinks = () => {
  const links = [
    { icon: FaGithub, url: 'https://github.com/ArnabBir', label: 'GitHub' },
    { icon: FaLinkedin, url: 'https://www.linkedin.com/in/arnabbir/', label: 'LinkedIn' },
    { icon: FaTwitter, url: 'https://twitter.com/arnabbir', label: 'Twitter' },
    { icon: FaEnvelope, url: 'mailto:arnabbir@gmail.com', label: 'Email' },
    { icon: SiSubstack, url: 'https://substack.com/@arnabbir', label: 'Substack' },
    { icon: SiLeetcode, url: 'https://leetcode.com/u/ArnabBir/', label: 'LeetCode' },
    { icon: FaInstagram, url: 'https://www.instagram.com/arnabbir/', label: 'Instagram' },
    { icon: FaHackerrank, url: 'https://www.hackerrank.com/ArnabBir', label: 'HackerRank' }
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-end mt-2 items-center">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors duration-300 inline-flex items-center justify-center"
          title={link.label}
        >
          <link.icon className="w-6 h-6" />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;