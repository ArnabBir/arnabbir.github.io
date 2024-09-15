import React from 'react';
import TypewriterEffect from '../components/TypewriterEffect';

const HelloWorld = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-200">
        <TypewriterEffect text="Hello World!" speed={100} loop={false} />
      </h1>
    </div>
  );
};

export default HelloWorld;