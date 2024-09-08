import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Calendar } from "lucide-react";

const Hero = () => {
  const [nameText, setNameText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullName = "Arnab Bir";
  const fullSubtitle = "Software Engineer | Tech Blogger | Innovator";

  useEffect(() => {
    let nameIndex = 0;
    let subtitleIndex = 0;
    let nameInterval, subtitleInterval;

    const typeNameInterval = setInterval(() => {
      if (nameIndex < fullName.length) {
        setNameText((prev) => prev + fullName.charAt(nameIndex));
        nameIndex++;
      } else {
        clearInterval(nameInterval);
        subtitleInterval = setInterval(() => {
          if (subtitleIndex < fullSubtitle.length) {
            setSubtitleText((prev) => prev + fullSubtitle.charAt(subtitleIndex));
            subtitleIndex++;
          } else {
            clearInterval(subtitleInterval);
            setTimeout(() => setShowCursor(false), 500);
          }
        }, 50);
      }
    }, 100);

    return () => {
      clearInterval(nameInterval);
      clearInterval(subtitleInterval);
    };
  }, []);

  return (
    <section className="relative bg-black text-green-500 py-32">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-5xl md:text-6xl mb-4 whitespace-pre-line">
              {nameText}
              {showCursor && <span className="animate-blink">|</span>}
            </h1>
            <p className="text-xl md:text-2xl mt-2">
              {subtitleText}
              {showCursor && subtitleText.length === fullSubtitle.length && <span className="animate-blink">|</span>}
            </p>
            <div className="flex space-x-4 mt-6">
              <Button asChild variant="outline" size="lg" className="bg-green-500 text-black hover:bg-green-600">
                <a href="https://www.linkedin.com/in/arnabbir/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-5 w-5" /> LinkedIn
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-green-500 text-black hover:bg-green-600">
                <a href="https://github.com/yourgithub" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-5 w-5" /> GitHub
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-green-500 text-black hover:bg-green-600">
                <a href="https://topmate.io/arnab_bir" target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-5 w-5" /> Topmate
                </a>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img src="https://via.placeholder.com/400" alt="Arnab Bir" className="rounded-full w-64 h-64 object-cover border-4 border-green-500 shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;