import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faFileContract,
  faFileInvoiceDollar,
  faCogs,
  faMoneyBillWave,
  faCalendarAlt,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import apiService from '../services/api';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    clientsCount: 0,
    contractsCount: 0,
    facturesCount: 0,
    interventionsCount: 0,
    totalRevenue: 0,
    upcomingInterventions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [clients, contracts, factures, interventions, chiffreAffaires, upcomingInterventions] = await Promise.all([
        apiService.getClients(),
        apiService.getContracts(),
        apiService.getFactures(),
        apiService.getInterventions(),
        apiService.getChiffreAffaires(),
        apiService.getUpcomingInterventions()
      ]);

      setStats({
        clientsCount: clients.length,
        contractsCount: contracts.length,
        facturesCount: factures.length,
        interventionsCount: interventions.length,
        totalRevenue: chiffreAffaires,
        upcomingInterventions: upcomingInterventions.slice(0, 5)
      });
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données du tableau de bord');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(price);
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <div className="bg-white rounded-lg shadow-lg border border-primary-100 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 text-${color}-600`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-ubuntu-medium text-primary-600 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-ubuntu-bold text-primary-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-ubuntu-bold text-primary-900">Tableau de bord</h2>
        <p className="text-primary-600 font-ubuntu">Vue d'ensemble de votre activité et statistiques principales</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Clients"
          value={stats.clientsCount}
          icon={
            <FontAwesomeIcon icon={faUsers} className="w-8 h-8" />
          }
        />

        <StatCard
          title="Contrats"
          value={stats.contractsCount}
          icon={
            <FontAwesomeIcon icon={faFileContract} className="w-8 h-8" />
          }
        />

        <StatCard
          title="Factures"
          value={stats.facturesCount}
          icon={
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-8 h-8" />
          }
        />

        <StatCard
          title="Interventions"
          value={stats.interventionsCount}
          icon={
            <FontAwesomeIcon icon={faCogs} className="w-8 h-8" />
          }
        />
      </div>

      {/* Revenue Card */}
      <div className="bg-white rounded-lg shadow-lg border border-primary-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-ubuntu-bold text-primary-900">Chiffre d'affaires</h3>
            <p className="text-xs text-primary-500 font-ubuntu mb-2">Revenus des factures payées</p>
            <p className="text-3xl font-ubuntu-bold text-green-600">
              {formatPrice(stats.totalRevenue)}
            </p>
          </div>
          <div className="text-green-600">
            <FontAwesomeIcon icon={faMoneyBillWave} className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Upcoming Interventions */}
      <div className="bg-white rounded-lg shadow-lg border border-primary-100 p-6">
        <h3 className="text-lg font-ubuntu-bold text-primary-900 mb-4">Prochaines Interventions</h3>

        {stats.upcomingInterventions.length === 0 ? (
          <p className="text-primary-500 font-ubuntu text-center py-8">
            Aucune intervention programmée
          </p>
        ) : (
          <div className="space-y-3">
            {stats.upcomingInterventions.map((intervention) => (
              <div key={intervention.id} className="flex items-center justify-between p-3 bg-primary-25 rounded-lg">
                <div>
                  <h4 className="font-ubuntu-medium text-primary-900">{intervention.title}</h4>
                  <p className="text-sm text-primary-600 font-ubuntu">
                    {intervention.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-ubuntu-medium text-primary-700">
                    {new Date(intervention.scheduledTime).toLocaleDateString('fr-MA')}
                  </p>
                  <p className="text-xs text-primary-500 font-ubuntu">
                    {new Date(intervention.scheduledTime).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {intervention.contract?.client && (
                    <p className="text-xs text-primary-600 font-ubuntu-medium mt-1">
                      {intervention.contract.client.firstName} {intervention.contract.client.lastName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;