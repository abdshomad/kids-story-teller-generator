
import React from 'react';

interface LoadingScreenProps {
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-200 to-indigo-300 flex flex-col items-center justify-center text-white p-4 z-50">
      <div className="w-24 h-24 border-8 border-white border-t-yellow-300 rounded-full animate-spin mb-8"></div>
      <h2 className="text-3xl font-extrabold text-center mb-2 animate-pulse">{message}</h2>
      <p className="text-lg text-center opacity-80">The magic is happening!</p>
    </div>
  );
};

export default LoadingScreen;
