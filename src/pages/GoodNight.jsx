import React from 'react';
import TypewriterEffect from '../components/TypewriterEffect';

const GoodNight = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 to-black">
      <h1 className="text-6xl font-bold text-white">
        <TypewriterEffect text="Good Night!" speed={100} loop={false} />
      </h1>
    </div>
  );
};

export default GoodNight;