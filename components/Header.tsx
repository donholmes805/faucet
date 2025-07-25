
import React from 'react';
import { LogoIcon } from './Icon';

const Header: React.FC = () => {
  return (
    <header className="py-6">
      <div className="flex items-center space-x-3">
        <LogoIcon className="h-8 w-8 text-gray-900" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Fitochain Testnet Faucet
        </h1>
      </div>
    </header>
  );
};

export default Header;