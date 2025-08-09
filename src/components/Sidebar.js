import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faUsers,
  faFileContract,
  faCogs,
  faTools,
  faFileInvoiceDollar,
  faUserCog,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <FontAwesomeIcon icon={faTachometerAlt} className="w-5 h-5" />
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <FontAwesomeIcon icon={faUsers} className="w-5 h-5" />
    },
    {
      id: 'contrats',
      label: 'Contrats',
      icon: <FontAwesomeIcon icon={faFileContract} className="w-5 h-5" />
    },
    {
      id: 'interventions',
      label: 'Interventions',
      icon: <FontAwesomeIcon icon={faCogs} className="w-5 h-5" />
    },
    {
      id: 'equipment',
      label: 'Équipements',
      icon: <FontAwesomeIcon icon={faTools} className="w-5 h-5" />
    },
    {
      id: 'factures',
      label: 'Factures',
      icon: <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-5 h-5" />
    },
    {
      id: 'techniciens',
      label: 'Techniciens',
      icon: <FontAwesomeIcon icon={faUserCog} className="w-5 h-5" />
    }
  ];

  const handleItemClick = (itemId) => {
    setActiveTab(itemId);
    if (toggleSidebar && typeof toggleSidebar === 'function') {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl border-r border-primary-200 z-50 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-primary-200">
            <h2 className="text-lg font-ubuntu-bold text-primary-900">Navigation</h2>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                  ${activeTab === item.id
                    ? 'bg-primary-100 text-primary-900 shadow-sm border border-primary-200'
                    : 'text-primary-700 hover:bg-primary-50 hover:text-primary-900'
                  }
                `}
              >
                <span className={`
                  ${activeTab === item.id ? 'text-primary-600' : 'text-primary-500'}
                `}>
                  {item.icon}
                </span>
                <span className="font-ubuntu-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;