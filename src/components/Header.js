import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCogs, faTimes } from '@fortawesome/free-solid-svg-icons';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-white shadow-lg border-b border-primary-200 sticky top-0 z-40">
      <div className="flex items-center px-4 py-4 lg:px-6">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faCogs} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-ubuntu-bold text-primary-900">
                Gestion de Maintenance
              </h1>
              <p className="text-sm text-primary-600 font-ubuntu">
                Système de gestion - Maroc
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;