import React from 'react';
import TypewriterEffect from '../components/TypewriterEffect';

const HappyBirthday = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-500">
      <h1 className="text-6xl font-bold text-white">
        <TypewriterEffect text="Happy Birthday!" speed={100} loop={false} />
      </h1>
    </div>
  );
};

export default HappyBirthday;