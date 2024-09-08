import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Experience from '../components/Experience';
import Blogs from '../components/Blogs';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16"> {/* Add padding-top to account for fixed header */}
        <Hero />
        <About />
        <Experience />
        <Blogs />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;