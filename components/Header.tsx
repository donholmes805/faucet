
import React from 'react';
import { FitoLogo } from './icons';

const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 md:px-8">
      <div className="container mx-auto flex items-center gap-4">
        <FitoLogo className="h-10 w-10" />
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Fitochain Faucet
        </h1>
      </div>
    </header>
  );
};

export default Header;
