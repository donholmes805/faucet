
import React from 'react';
import FaucetCard from './components/FaucetCard';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col items-center antialiased">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        <main className="flex-grow flex items-center justify-center py-12 sm:py-24">
          <FaucetCard />
        </main>
      </div>
    </div>
  );
};

export default App;