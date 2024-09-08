import React from 'react';
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter, FaFacebook, FaEnvelope, FaHackerrank, FaStackOverflow, FaGlobe } from 'react-icons/fa';
import { SiCodechef, SiCodeforces, SiLeetcode } from 'react-icons/si';

const SocialLinks = () => {
  const links = [
    { icon: FaGithub, url: 'https://github.com/ArnabBir', label: 'GitHub' },
    { icon: FaLinkedin, url: 'https://www.linkedin.com/in/arnabbir/', label: 'LinkedIn' },
    { icon: FaInstagram, url: 'https://www.instagram.com/arnabbir/', label: 'Instagram' },
    { icon: FaTwitter, url: 'https://twitter.com/arnabbir', label: 'Twitter' },
    { icon: FaFacebook, url: 'https://www.facebook.com/arnabbir', label: 'Facebook' },
    { icon: FaEnvelope, url: 'mailto:arnabbir@gmail.com', label: 'Email' },
    { icon: SiLeetcode, url: 'https://leetcode.com/u/ArnabBir/', label: 'LeetCode' },
    { icon: SiCodechef, url: 'https://www.codechef.com/users/arnabbir', label: 'CodeChef' },
    { icon: SiCodeforces, url: 'https://codeforces.com/profile/ArnabBir', label: 'Codeforces' },
    { icon: FaHackerrank, url: 'https://www.hackerrank.com/ArnabBir', label: 'HackerRank' },
    { icon: FaStackOverflow, url: 'https://stackoverflow.com/users/3905079/arnab-bir', label: 'Stack Overflow' },
    { icon: FaGlobe, url: 'https://topmate.io/arnab_bir', label: 'Topmate' },
    { icon: FaGlobe, url: 'https://preplaced.in/profile/arnab-bir', label: 'Preplaced' },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-800 transition-colors duration-300"
          title={link.label}
        >
          <link.icon className="w-6 h-6" />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;