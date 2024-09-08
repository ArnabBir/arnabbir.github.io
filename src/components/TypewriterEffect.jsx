import React, { useState, useEffect } from 'react';

const TypewriterEffect = ({ text, speed = 100, loop = false, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let typingTimeout;
    let pauseTimeout;

    if (currentIndex < text.length) {
      typingTimeout = setTimeout(() => {
        setDisplayText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, speed);
    } else if (loop) {
      // When typing is complete, add a small pause before restarting
      pauseTimeout = setTimeout(() => {
        setDisplayText('');
        setCurrentIndex(0);
        setIsTyping(true);
      }, 2000); // 2-second pause before repeating
    } else {
      setIsTyping(false); // Typing done, stop cursor
      if (onComplete) onComplete();
    }

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(pauseTimeout);
    };
  }, [currentIndex, text, speed, loop, onComplete]);

  return (
    <span>
      {displayText}
      {isTyping && <span className="animate-pulse">|</span>} {/* Blinking cursor while typing */}
    </span>
  );
};

export default TypewriterEffect;
