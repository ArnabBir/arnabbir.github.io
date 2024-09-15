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
import AcademicSection from '@/components/AcademicSection';
import CertificationsSection from '@/components/CertificationsSection';
import TechnicalSkills from '@/components/TechnicalSkills';
import Projects from '@/components/Projects';
import { useTheme } from 'next-themes';

const Index = () => {
  const [showName, setShowName] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const { theme, setTheme } = useTheme();

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
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          
          <div className="flex items-center">
            <img 
              src={theme === 'dark' ? "/images/logo-dark.png" : "/images/logo.png"} 
              alt="Logo" 
              className="w-12 h-12 mr-4" 
            />
          </div>
          <Navigation />
          <div className="flex items-center">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <section id="home" className="mb-12">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="md:w-1/3"
            >
              <ProfilePicture />
            </motion.div>
            <div className="md:w-2/3 mt-6 md:mt-0 md:ml-6 flex flex-col items-center md:items-start">
              <h1 className="text-3xl font-bold mb-2 text-center md:text-left">
                {!showName && (
                  <TypewriterEffect text="Arnab Bir" speed={100} onComplete={handleNameComplete} hideCursorOnComplete={true} />
                )}
                {showName && "Arnab Bir"}
              </h1>
              {showName && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-3 text-center md:text-left">
                  {!showTitle && (
                    <TypewriterEffect text="SWE at PhonePe. Ex-SWE at Google and Flipkart" speed={50} onComplete={handleTitleComplete} hideCursorOnComplete={true} />
                  )}
                  {showTitle && "SWE at PhonePe. Ex-SWE at Google and Flipkart"}
                </p>
              )}
              {showTitle && <SocialLinks />}
            </div>
          </div>
        </section>

        <AboutMe />
        <BlogSection />
        <ExperienceSection />
        <AcademicSection />
        <OpenSourceProjects />
        <Projects />
        <CertificationsSection />
        <TechnicalSkills />
        <GetInTouch />
      </main>

      <footer className="bg-gray-800 dark:bg-gray-950 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; 2024 Arnab Bir. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
