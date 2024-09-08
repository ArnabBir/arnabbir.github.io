import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProfilePicture from '../components/ProfilePicture';
import SocialLinks from '../components/SocialLinks';
import BlogSection from '../components/BlogSection';
import ExperienceSection from '../components/ExperienceSection';
import AboutMe from '../components/AboutMe';
import GetInTouch from '../components/GetInTouch';
import Navigation from '../components/Navigation';
import OpenSourceProjects from '../components/OpenSourceProjects';
import TypewriterEffect from '../components/TypewriterEffect';

const Index = () => {
  const [showName, setShowName] = useState(false);
  const [showTitle, setShowTitle] = useState(false);

  const handleNameComplete = () => {
    if (!showName) {
      setShowName(true);
    }
  };

  const handleTitleComplete = () => {
    if (!showTitle) {
      setShowTitle(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Navigation />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <section id="home" className="mb-16">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="md:w-1/2"
            >
              <ProfilePicture />
            </motion.div>
            <div className="md:w-1/2 mt-8 md:mt-0 md:ml-8">
              <h1 className="text-4xl font-bold mb-2">
                {!showName && (
                  <TypewriterEffect text="Arnab Bir" speed={100} onComplete={handleNameComplete} />
                )}
                {showName && "Arnab Bir"}
              </h1>
              {showName && (
                <p className="text-2xl text-gray-600 mb-4">
                  {!showTitle && (
                    <TypewriterEffect text="SWE at PhonePe. Ex-SWE at Google and Flipkart" speed={50} onComplete={handleTitleComplete} />
                  )}
                  {showTitle && "SWE at PhonePe. Ex-SWE at Google and Flipkart"}
                </p>
              )}
              {showTitle && <SocialLinks />}
            </div>
          </div>
        </section>

        <AboutMe />
        <ExperienceSection />
        <BlogSection />
        <OpenSourceProjects />
        <GetInTouch />
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 Arnab Bir. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
