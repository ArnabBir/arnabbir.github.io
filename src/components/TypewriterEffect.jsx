import React, { useState, useEffect, useRef } from 'react';

const TypewriterEffect = ({ text, speed = 100, loop = false, onComplete, pause = 5000, hideCursorOnComplete = false }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    let typingTimeout;
    let pauseTimeout;

    if (currentIndex < text.length) {
      typingTimeout = setTimeout(() => {
        setDisplayText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, speed);
    } else {
      setIsTyping(false);
      if (hideCursorOnComplete) {
        setShowCursor(false);
      }
      if (onComplete) onComplete();
      if (loop) {
        pauseTimeout = setTimeout(() => {
          setDisplayText('');
          setCurrentIndex(0);
          setIsTyping(true);
          setShowCursor(true);
        }, pause);
      }
    }

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(pauseTimeout);
    };
  }, [currentIndex, text, speed, loop, onComplete, pause, hideCursorOnComplete]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.minHeight = `${containerRef.current.scrollHeight}px`;
    }
  }, [displayText]);

  return (
    <span ref={containerRef} className="inline-block">
      {displayText}
      {showCursor && <span className="animate-pulse">|</span>}
    </span>
  );
};

export default TypewriterEffect;