import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import apiService from '../services/api';
import {
  showSuccess,
  showError,
  showCascadeDeleteConfirmation,
  showLoading,
  closeLoading,
  showNetworkError,
  showConfirmation
} from '../services/alerts';

const InterventionsPage = () => {
  const [interventions, setInterventions] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    contractId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [interventionsData, contractsData] = await Promise.all([
        apiService.getInterventions(),
        apiService.getContracts()
      ]);
      setInterventions(interventionsData);
      setContracts(contractsData);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des interventions');
      console.error('Error loading interventions:', err);
      if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError('Erreur de chargement', 'Impossible de charger la liste des interventions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (intervention) => {
    if (intervention.contract && intervention.contract.client) {
      return `${intervention.contract.client.firstName} ${intervention.contract.client.lastName}`;
    }
    return 'Client inconnu';
  };

  const getContractInfo = (intervention) => {
    if (intervention.contract) {
      const client = intervention.contract.client ? `${intervention.contract.client.firstName} ${intervention.contract.client.lastName}` : 'Client inconnu';
      return {
        id: intervention.contract.id,
        client: client
      };
    }
    return { id: 'N/A', client: 'Client inconnu' };
  };

  const getClientNameForContract = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return 'Contrat introuvable';

    // Handle nested client structure from contract
    if (contract.client) {
      if (contract.client.clientType === 'COMPANY' && contract.client.companyName) {
        return contract.client.companyName;
      }
      return `${contract.client.firstName} ${contract.client.lastName}`;
    }
    return 'Client inconnu';
  };

  const handleCreate = () => {
    setEditingIntervention(null);
    setFormData({
      title: '',
      description: '',
      scheduledTime: '',
      contractId: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (intervention) => {
    setEditingIntervention(intervention);
    const contractId = intervention.contract ? intervention.contract.id : '';
    setFormData({
      title: intervention.title || '',
      description: intervention.description || '',
      scheduledTime: intervention.scheduledTime ? intervention.scheduledTime.slice(0, 16) : '',
      contractId: contractId.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const intervention = interventions.find(i => i.id === id);
    const interventionName = intervention ? intervention.title : `Intervention #${id}`;
    const contractInfo = intervention ? getContractInfo(intervention) : { client: 'Client inconnu' };

    try {
      const result = await showConfirmation(
        'Annuler l\'intervention',
        `Êtes-vous sûr de vouloir annuler "${interventionName}" ?`,
        'Oui, annuler',
        'Non, garder'
      );

      if (result.isConfirmed) {
        showLoading('Annulation en cours...', 'Suppression de l\'intervention');

        await apiService.deleteIntervention(id);

        closeLoading();
        await loadData();

        showSuccess(
          'Intervention annulée !',
          `${interventionName} a été annulée avec succès.`
        );
      }
    } catch (err) {
      closeLoading();
      console.error('Error deleting intervention:', err);

      if (err.message.includes('constraint') || err.message.includes('foreign key')) {
        showError(
          'Impossible d\'annuler cette intervention',
          'Une erreur s\'est produite. Cette intervention a des ressources attachées. Veuillez supprimer ces ressources avant d\'annuler l\'intervention.'
        );
      } else if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError(
          'Erreur d\'annulation',
          'Une erreur est survenue lors de l\'annulation de l\'intervention. Veuillez réessayer.'
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.contractId) {
      showError('Erreur de validation', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!formData.scheduledTime) {
      showError('Date requise', 'Veuillez définir une date et heure pour l\'intervention.');
      return;
    }

    const scheduledDate = new Date(formData.scheduledTime);
    const now = new Date();
    if (scheduledDate <= now && !editingIntervention) {
      showError('Date invalide', 'La date et l\'heure doivent être dans le futur.');
      return;
    }

    try {
      showLoading(
        editingIntervention ? 'Modification en cours...' : 'Planification en cours...',
        'Sauvegarde de l\'intervention'
      );

      const interventionData = {
        ...formData,
        contractId: formData.contractId ? parseInt(formData.contractId) : null
      };

      if (editingIntervention) {
        await apiService.updateIntervention(editingIntervention.id, interventionData);
      } else {
        await apiService.createIntervention(interventionData);
      }

      closeLoading();
      setIsModalOpen(false);
      await loadData();

      const contractName = getClientNameForContract(parseInt(formData.contractId));

      showSuccess(
        editingIntervention ? 'Intervention modifiée !' : 'Intervention planifiée !',
        editingIntervention
          ? `L'intervention "${formData.title}" a été mise à jour.`
          : `L'intervention "${formData.title}" a été planifiée pour ${contractName}.`
      );

    } catch (err) {
      closeLoading();
      console.error('Error saving intervention:', err);

      if (err.message.includes('conflict') || err.message.includes('schedule')) {
        showError(
          'Conflit de planification',
          'Une autre intervention est déjà planifiée à cette date et heure.'
        );
      } else if (err.message.includes('validation')) {
        showError(
          'Erreur de validation',
          'Les données saisies ne sont pas valides. Veuillez vérifier vos informations.'
        );
      } else if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError(
          editingIntervention ? 'Erreur de modification' : 'Erreur de planification',
          'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.'
        );
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    return new Date(dateTimeString).toLocaleString('fr-MA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getInvoiceStatusBadge = (status) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Brouillon' },
      'SENT': { color: 'bg-blue-100 text-blue-800', label: 'Envoyée' },
      'PAID': { color: 'bg-green-100 text-green-800', label: 'Payée' },
      'OVERDUE': { color: 'bg-red-100 text-red-800', label: 'En retard' },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', label: 'Annulée' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-ubuntu-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const isUpcoming24Hours = (scheduledTime) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffHours = (scheduled - now) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-ubuntu-bold text-primary-900">Gestion des Interventions</h2>
          <p className="text-primary-600 font-ubuntu">Planifiez et suivez les interventions de maintenance</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-ubuntu-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nouvelle Intervention</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Interventions table */}
      <div className="bg-white rounded-lg shadow-lg border border-primary-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-100">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Intervention
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Contrat / Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Planification
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Facturation
                </th>
                <th className="px-6 py-3 text-right text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-100">
              {interventions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-primary-500 font-ubuntu">
                    Aucune intervention trouvée
                  </td>
                </tr>
              ) : (
                interventions.map((intervention) => {
                  const contractInfo = getContractInfo(intervention);
                  return (
                    <tr key={intervention.id} className="hover:bg-primary-25 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-ubuntu-medium text-primary-900">
                            {intervention.title}
                          </div>
                          <div className="text-sm text-primary-600 font-ubuntu mt-1">
                            {intervention.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-primary-700 font-ubuntu-medium">
                            {contractInfo.client}
                          </div>
                          <div className="text-sm text-primary-500 font-ubuntu">
                            {contractInfo.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="text-primary-700 font-ubuntu">
                            {formatDateTime(intervention.scheduledTime)}
                          </div>
                          {isUpcoming24Hours(intervention.scheduledTime) && (
                            <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 font-ubuntu-medium">
                              Bientôt
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {intervention.facture ? (
                          <div className="space-y-1">
                            <div className="text-primary-700 font-ubuntu-medium">
                              {formatCurrency(intervention.facture.totalAmount || intervention.facture.price)}
                            </div>
                            <div className="text-sm text-primary-500 font-ubuntu">
                              {intervention.facture.invoiceNumber}
                            </div>
                            {getInvoiceStatusBadge(intervention.facture.status)}
                          </div>
                        ) : (
                          <span className="text-primary-400 font-ubuntu">Pas de facture</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(intervention)}
                          className="text-primary-600 hover:text-primary-900 font-ubuntu-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(intervention.id)}
                          className="text-red-600 hover:text-red-900 font-ubuntu-medium ml-4"
                        >
                          Annuler
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIntervention ? 'Modifier l\'Intervention' : 'Nouvelle Intervention'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Titre de l'intervention *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Maintenance HVAC, Réparation électrique..."
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              placeholder="Description détaillée de l'intervention à effectuer..."
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            />
          </div>

          {/* Contract Assignment */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Contrat associé *
            </label>
            <select
              name="contractId"
              value={formData.contractId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            >
              <option value="">Sélectionner un contrat</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  Contrat #{contract.id} - {getClientNameForContract(contract.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Date et heure prévues *
            </label>
            <input
              type="datetime-local"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            />
            <p className="text-sm text-primary-500 mt-1">
              {editingIntervention
                ? 'Vous pouvez reprogrammer cette intervention.'
                : 'Sélectionnez une date et heure futures pour l\'intervention.'
              }
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 border border-primary-300 text-primary-700 font-ubuntu-medium rounded-lg hover:bg-primary-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-ubuntu-medium rounded-lg transition-colors"
            >
              {editingIntervention ? 'Modifier' : 'Planifier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InterventionsPage;