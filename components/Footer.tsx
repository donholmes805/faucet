
import React from 'react';
import { EXPLORER_URL } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 mt-12 border-t border-fito-border">
      <div className="container mx-auto text-center text-fito-text-dark">
        <p>&copy; {new Date().getFullYear()} Fitochain. All Rights Reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="https://fitochain.com/" target="_blank" rel="noopener noreferrer" className="hover:text-fito-green transition-colors">Fitochain Home</a>
          <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="hover:text-fito-green transition-colors">Block Explorer</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
