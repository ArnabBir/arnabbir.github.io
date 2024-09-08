import React from 'react';
import { Link } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';

const Navigation = () => {
  const navItems = [
    { title: 'Home', to: 'home' },
    { title: 'About', to: 'about' },
    { title: 'Experience', to: 'experience' },
    { title: 'Blogs', to: 'blogs' },
    { title: 'Projects', to: 'projects' },
    { title: 'Contact', to: 'contact' },
  ];

  return (
    <nav className="flex justify-between items-center">
      <Link to="/" className="text-3xl font-bold text-gray-800">Arnab Bir</Link>
      <ul className="flex space-x-6">
        {navItems.map((item) => (
          <li key={item.to}>
            <ScrollLink
              to={item.to}
              smooth={true}
              duration={500}
              className="text-gray-600 hover:text-gray-800 cursor-pointer transition-colors duration-300"
            >
              {item.title}
            </ScrollLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;