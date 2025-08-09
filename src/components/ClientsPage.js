import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faUsers } from '@fortawesome/free-solid-svg-icons';
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

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await apiService.getClients();
      setClients(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des clients');
      console.error('Error loading clients:', err);
      if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError('Erreur de chargement', 'Impossible de charger la liste des clients.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingClient(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (clientId) => {
    const client = clients.find(c => c.clientId === clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : `Client #${clientId}`;

    try {
      const result = await showConfirmation(
        'Supprimer le client',
        `Êtes-vous sûr de vouloir supprimer ${clientName} ?`,
        'Oui, supprimer',
        'Annuler'
      );

      if (result.isConfirmed) {
        showLoading('Suppression en cours...', 'Suppression du client');

        await apiService.deleteClient(clientId);

        closeLoading();
        await loadClients();

        showSuccess(
          'Client supprimé !',
          `${clientName} a été supprimé avec succès.`
        );
      }
    } catch (err) {
      closeLoading();
      console.error('Error deleting client:', err);

      if (err.message.includes('constraint') || err.message.includes('foreign key')) {
        showError(
          'Impossible de supprimer ce client',
          'Une erreur s\'est produite. Ce client a des ressources attachées (contrats, équipements, interventions). Veuillez supprimer ces ressources avant de supprimer le client.'
        );
      } else if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError(
          'Erreur de suppression',
          'Une erreur est survenue lors de la suppression du client. Veuillez réessayer.'
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showError('Erreur de validation', 'Le prénom et le nom sont requis.');
      return;
    }
    if (!formData.email.trim()) {
      showError('Erreur de validation', 'L\'email est requis.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showError('Erreur de validation', 'L\'email n\'est pas valide.');
      return;
    }

    try {
      showLoading(
        editingClient ? 'Modification en cours...' : 'Création en cours...',
        'Sauvegarde des informations client'
      );

      if (editingClient) {
        await apiService.updateClient(editingClient.clientId, formData);
      } else {
        await apiService.createClient(formData);
      }

      closeLoading();
      setIsModalOpen(false);
      await loadClients();

      showSuccess(
        editingClient ? 'Client modifié !' : 'Client créé !',
        editingClient
          ? `Les informations de ${formData.firstName} ${formData.lastName} ont été mises à jour.`
          : `${formData.firstName} ${formData.lastName} a été ajouté avec succès.`
      );

    } catch (err) {
      closeLoading();
      console.error('Error saving client:', err);

      if (err.message.includes('duplicate') || err.message.includes('unique')) {
        showError(
          'Client déjà existant',
          'Un client avec cette adresse email existe déjà.'
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
          editingClient ? 'Erreur de modification' : 'Erreur de création',
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
          <h2 className="text-2xl font-ubuntu-bold text-primary-900">Gestion des Clients</h2>
          <p className="text-primary-600 font-ubuntu">Gérez vos clients individuels, entreprises et entités gouvernementales</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-ubuntu-medium transition-colors flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Clients table */}
      <div className="bg-white rounded-lg shadow-lg border border-primary-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-100">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-right text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-primary-500 font-ubuntu">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.clientId} className="hover:bg-primary-25 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-ubuntu-medium text-primary-900">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-sm text-primary-500 font-ubuntu">
                          ID: {client.clientId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-primary-700 font-ubuntu">
                          {client.email}
                        </div>
                        <div className="text-sm text-primary-500 font-ubuntu">
                          {client.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-primary-700 font-ubuntu">
                        {client.address || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-primary-700 font-ubuntu">
                        {formatDate(client.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-primary-600 hover:text-primary-900 font-ubuntu-medium"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDelete(client.clientId)}
                        className="text-red-600 hover:text-red-900 font-ubuntu-medium ml-4"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Modifier le Client' : 'Nouveau Client'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                placeholder="John"
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              />
            </div>
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                placeholder="Doe"
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="john.doe@example.com"
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            />
          </div>

          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Téléphone *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              placeholder="0612345678"
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Adresse *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows={3}
              placeholder="123 Rue Mohammed V, Casablanca, Maroc"
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            />
          </div>

          {/* Info message */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-ubuntu-medium">Informations client</p>
                <p className="text-sm font-ubuntu">
                  Ce client pourra être associé à des contrats de maintenance et bénéficier de vos services.
                  Tous les champs sont requis pour créer un profil client complet.
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
              {editingClient ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientsPage;