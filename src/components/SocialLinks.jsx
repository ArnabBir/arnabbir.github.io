import React from 'react';
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter, FaFacebook, FaEnvelope, FaHackerrank, FaStackOverflow, FaGlobe } from 'react-icons/fa';
import { SiCodechef, SiCodeforces, SiLeetcode } from 'react-icons/si';

const SocialLinks = () => {
  const links = [
    { icon: FaGithub, url: 'https://github.com/ArnabBir', label: 'GitHub' },
    { icon: FaLinkedin, url: 'https://www.linkedin.com/in/arnabbir/', label: 'LinkedIn' },
    { icon: FaTwitter, url: 'https://twitter.com/arnabbir', label: 'Twitter' },
    { icon: FaEnvelope, url: 'mailto:arnabbir@gmail.com', label: 'Email' },
    { icon: SiLeetcode, url: 'https://leetcode.com/u/ArnabBir/', label: 'LeetCode' },
    { icon: SiCodechef, url: 'https://www.codechef.com/users/arnabbir', label: 'CodeChef' },
    { icon: FaHackerrank, url: 'https://www.hackerrank.com/ArnabBir', label: 'HackerRank' }
  ];

  return (
    <div className="flex flex-wrap gap-4 justify-end mt-2">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors duration-300"
          title={link.label}
        >
          <link.icon className="w-6 h-6" />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;