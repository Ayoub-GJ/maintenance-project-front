import React from 'react';
import DashboardPage from './DashboardPage';
import ClientsPage from './ClientsPage';
import ContractsPage from './ContractsPage';
import InterventionsPage from './InterventionsPage';
import EquipmentPage from './EquipmentPage';
import FacturesPage from './FacturesPage';
import TechniciansPage from './TechniciansPage';

// NEW: import the two new pages
import ContactPage from './ContactPage';
import AssistantIA from './AssistantIA';

const MainContent = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'clients':
        return <ClientsPage />;
      case 'contrats':
        return <ContractsPage />;
      case 'factures':
        return <FacturesPage />;
      case 'interventions':
        return <InterventionsPage />;
      case 'equipment':
        return <EquipmentPage />;
      case 'techniciens':
        return <TechniciansPage />;

      // NEW: handle the two new sidebar items
      case 'contact':
        return <ContactPage />;
      case 'assistant-ia':
        return <AssistantIA />;

      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      {renderContent()}
    </div>
  );
};

export default MainContent;
