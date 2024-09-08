import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-background shadow-md fixed top-0 left-0 right-0 z-50">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">Arnab Bir</Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">Home</Link>
            <a href="#about" className="text-foreground hover:text-primary transition-colors">About</a>
            <a href="#experience" className="text-foreground hover:text-primary transition-colors">Experience</a>
            <a href="#blogs" className="text-foreground hover:text-primary transition-colors">Blogs</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;