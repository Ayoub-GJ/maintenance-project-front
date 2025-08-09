import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import apiService from '../services/api';
import {
  showSuccess,
  showError,
  showConfirmation,
  showLoading,
  closeLoading,
  showNetworkError
} from '../services/alerts';

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({
    clientId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractsData, clientsData] = await Promise.all([
        apiService.getContracts(),
        apiService.getClients()
      ]);
      setContracts(contractsData);
      setClients(clientsData);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des contrats');
      console.error('Error loading contracts:', err);
      if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError('Erreur de chargement', 'Impossible de charger la liste des contrats.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (contract) => {
    if (contract.client) {
      return `${contract.client.firstName} ${contract.client.lastName}`;
    }
    return 'Client inconnu';
  };

  const getClientDetails = (contract) => {
    if (contract.client) {
      return {
        name: getClientName(contract),
        email: contract.client.email,
        phone: contract.client.phoneNumber,
        address: contract.client.address
      };
    }
    return {
      name: 'Client inconnu',
      email: '-',
      phone: '-',
      address: '-'
    };
  };

  const handleCreate = () => {
    setEditingContract(null);
    setFormData({
      clientId: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      clientId: contract.client ? contract.client.clientId : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const contract = contracts.find(c => c.id === id);
    const contractName = `Contrat #${id}`;
    const clientName = contract ? getClientName(contract) : 'Client inconnu';

    try {
      const result = await showConfirmation(
        'Supprimer le contrat',
        `Êtes-vous sûr de vouloir supprimer ${contractName} - ${clientName} ?`,
        'Oui, supprimer',
        'Annuler'
      );

      if (result.isConfirmed) {
        showLoading('Suppression en cours...', 'Suppression du contrat');

        await apiService.deleteContract(id);

        closeLoading();
        await loadData();

        showSuccess(
          'Contrat supprimé !',
          `${contractName} a été supprimé avec succès.`
        );
      }
    } catch (err) {
      closeLoading();
      console.error('Error deleting contract:', err);

      if (err.message.includes('constraint') || err.message.includes('foreign key')) {
        showError(
          'Impossible de supprimer ce contrat',
          'Une erreur s\'est produite. Ce contrat a des ressources attachées (interventions, factures). Veuillez supprimer ces ressources avant de supprimer le contrat.'
        );
      } else if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError(
          'Erreur de suppression',
          'Une erreur est survenue lors de la suppression du contrat. Veuillez réessayer.'
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId) {
      showError('Erreur de validation', 'Veuillez sélectionner un client.');
      return;
    }

    try {
      showLoading(
        editingContract ? 'Modification en cours...' : 'Création en cours...',
        'Sauvegarde du contrat'
      );

      const contractData = {
        clientId: parseInt(formData.clientId)
      };

      if (editingContract) {
        await apiService.updateContract(editingContract.id, contractData);
      } else {
        await apiService.createContract(contractData);
      }

      closeLoading();
      setIsModalOpen(false);
      await loadData();

      const clientName = clients.find(c => c.clientId === parseInt(formData.clientId));
      const clientDisplayName = clientName ? `${clientName.firstName} ${clientName.lastName}` : 'le client sélectionné';

      showSuccess(
        editingContract ? 'Contrat modifié !' : 'Contrat créé !',
        editingContract
          ? `Le contrat a été mis à jour pour ${clientDisplayName}.`
          : `Un nouveau contrat a été créé pour ${clientDisplayName}.`
      );

    } catch (err) {
      closeLoading();
      console.error('Error saving contract:', err);

      if (err.message.includes('duplicate') || err.message.includes('unique')) {
        showError(
          'Contrat déjà existant',
          'Un contrat existe déjà pour ce client.'
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
          editingContract ? 'Erreur de modification' : 'Erreur de création',
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-MA');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-MA');
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
          <h2 className="text-2xl font-ubuntu-bold text-primary-900">Gestion des Contrats</h2>
          <p className="text-primary-600 font-ubuntu">Gérez les contrats de maintenance avec vos clients</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-ubuntu-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nouveau Contrat</span>
        </button>
      </div>

      {/* Contracts table */}
      <div className="bg-white rounded-lg shadow-lg border border-primary-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-100">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Contrat
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-right text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-100">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-primary-500 font-ubuntu">
                    Aucun contrat trouvé
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => {
                  const clientDetails = getClientDetails(contract);
                  return (
                    <tr key={contract.id} className="hover:bg-primary-25 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-ubuntu-medium text-primary-900">
                            Contrat #{contract.id}
                          </div>
                          <div className="text-sm text-primary-500 font-ubuntu">
                            Créé le {formatDate(contract.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-ubuntu-medium text-primary-900">
                            {clientDetails.name}
                          </div>
                          <div className="text-sm text-primary-500 font-ubuntu">
                            {clientDetails.address}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-primary-700 font-ubuntu">
                            {clientDetails.email}
                          </div>
                          <div className="text-sm text-primary-500 font-ubuntu">
                            {clientDetails.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-primary-700 font-ubuntu text-sm">
                            <span className="text-primary-500">Créé:</span> {formatDateTime(contract.createdAt)}
                          </div>
                          {contract.updatedAt && contract.updatedAt !== contract.createdAt && (
                            <div className="text-primary-500 font-ubuntu text-sm">
                              <span>Modifié:</span> {formatDateTime(contract.updatedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(contract)}
                          className="text-primary-600 hover:text-primary-900 font-ubuntu-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(contract.id)}
                          className="text-red-600 hover:text-red-900 font-ubuntu-medium ml-4"
                        >
                          Supprimer
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
        title={editingContract ? 'Modifier le Contrat' : 'Nouveau Contrat'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Client *
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.clientId} value={client.clientId}>
                  {client.clientType === 'COMPANY' && client.companyName
                    ? `${client.companyName} (${client.firstName} ${client.lastName})`
                    : `${client.firstName} ${client.lastName}`
                  } - {client.email}
                </option>
              ))}
            </select>
            <p className="text-sm text-primary-500 mt-2">
              {editingContract
                ? 'Vous pouvez changer le client associé à ce contrat.'
                : 'Sélectionnez le client pour lequel créer un nouveau contrat de maintenance.'
              }
            </p>
          </div>

          {/* Info message */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-ubuntu-medium">Contrat de maintenance</p>
                <p className="text-sm font-ubuntu">
                  Ce contrat permettra de planifier des interventions de maintenance pour le client sélectionné.
                  Les détails du contrat (type, durée, tarifs) peuvent être gérés séparément selon vos besoins.
                </p>
              </div>
            </div>
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
              {editingContract ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContractsPage;