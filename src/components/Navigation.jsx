import React from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';

const Navigation = () => {
  const navItems = [
    { title: 'Home', to: 'home' },
    { title: 'About', to: 'about' },
    { title: 'Blogs', to: 'blogs' },
    { title: 'Experience', to: 'experience' },
    { title: 'Academics', to: 'academics' },
    { title: 'Projects', to: 'projects' },
    { title: 'Certifications', to: 'certifications' },
    { title: 'Contact', to: 'contact' },
  ];

  return (
    <nav className="flex justify-start items-center">
      <ul className="flex space-x-4">
        {navItems.map((item) => (
          <li key={item.to}>
            <ScrollLink
              to={item.to}
              smooth={true}
              duration={500}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer transition-colors duration-300">
              {item.title}
            </ScrollLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;