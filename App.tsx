import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import FaucetCard from './components/FaucetCard';
import TransactionExplainer from './components/TransactionExplainer';
import ContractAnalyzer from './components/ContractAnalyzer';
import FitochainQABot from './components/FitochainQABot';
import { FitoLogo, SearchIcon, ShieldCheckIcon, MessageSquareIcon } from './components/icons';

type Tab = 'faucet' | 'explainer' | 'analyzer' | 'qa';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('faucet');

  const tabs = useMemo(() => [
    { id: 'faucet', name: 'Faucet', icon: FitoLogo },
    { id: 'explainer', name: 'Tx Explainer', icon: SearchIcon },
    { id: 'analyzer', name: 'Contract Analyzer', icon: ShieldCheckIcon },
    { id: 'qa', name: 'Fitochain Q&A', icon: MessageSquareIcon },
  ], []);

  const renderContent = () => {
    switch (activeTab) {
      case 'faucet':
        return <FaucetCard />;
      case 'explainer':
        return <TransactionExplainer />;
      case 'analyzer':
        return <ContractAnalyzer />;
      case 'qa':
        return <FitochainQABot />;
      default:
        return <FaucetCard />;
    }
  };

  return (
    <div className="min-h-screen bg-fito-bg text-fito-text font-sans flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <div className="mb-8 overflow-x-auto">
            <div className="flex border-b border-fito-border space-x-2 sm:space-x-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-b-2 border-fito-green text-fito-green'
                      : 'text-fito-text-dark hover:text-white'
                  }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
