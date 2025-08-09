import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import apiService from '../services/api';
import {
  INVOICE_STATUS,
  PAYMENT_METHODS,
  getInvoiceStatusLabel
} from '../services/constants';
import {
  showSuccess,
  showError,
  showConfirmation,
  showLoading,
  closeLoading,
  showNetworkError
} from '../services/alerts';

const FacturesPage = () => {
  const [factures, setFactures] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    description: '',
    laborCost: '',
    materialCost: '',
    totalAmount: '',
    status: INVOICE_STATUS.DRAFT,
    dueDate: '',
    paidDate: '',
    paymentMethod: '',
    notes: '',
    interventionId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facturesData, interventionsData] = await Promise.all([
        apiService.getFactures(),
        apiService.getInterventions()
      ]);
      setFactures(facturesData);
      setInterventions(interventionsData);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des factures');
      console.error('Error loading data:', err);
      showError('Erreur de chargement', 'Impossible de charger la liste des factures.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFacture(null);
    setFormData({
      invoiceNumber: '',
      description: '',
      laborCost: '',
      materialCost: '',
      totalAmount: '',
      status: INVOICE_STATUS.DRAFT,
      dueDate: '',
      paidDate: '',
      paymentMethod: '',
      notes: '',
      interventionId: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (facture) => {
    setEditingFacture(facture);
    setFormData({
      invoiceNumber: facture.invoiceNumber || '',
      description: facture.description || '',
      laborCost: facture.laborCost || '',
      materialCost: facture.materialCost || '',
      totalAmount: facture.totalAmount || facture.price || '',
      status: facture.status || INVOICE_STATUS.DRAFT,
      dueDate: facture.dueDate ? facture.dueDate.split('T')[0] : '',
      paidDate: facture.paidDate ? facture.paidDate.split('T')[0] : '',
      paymentMethod: facture.paymentMethod || '',
      notes: facture.notes || '',
      interventionId: facture.interventionId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const facture = factures.find(f => f.id === id);
    const factureName = facture ? `Facture ${facture.invoiceNumber}` : `Facture #${id}`;

    try {
      const result = await showConfirmation(
        'Supprimer la facture',
        `Êtes-vous sûr de vouloir supprimer ${factureName} ?`,
        'Oui, supprimer',
        'Annuler'
      );

      if (result.isConfirmed) {
        showLoading('Suppression en cours...', 'Suppression de la facture');

        await apiService.deleteFacture(id);

        closeLoading();
        await loadData();

        showSuccess(
          'Facture supprimée !',
          `${factureName} a été supprimée avec succès.`
        );
      }
    } catch (err) {
      closeLoading();
      console.error('Error deleting facture:', err);

      if (err.message.includes('constraint') || err.message.includes('foreign key')) {
        showError(
          'Impossible de supprimer cette facture',
          'Une erreur s\'est produite. Cette facture a des ressources attachées. Veuillez supprimer ces ressources avant de supprimer la facture.'
        );
      } else if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError(
          'Erreur de suppression',
          'Une erreur est survenue lors de la suppression de la facture. Veuillez réessayer.'
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.invoiceNumber.trim()) {
      showError('Erreur de validation', 'Le numéro de facture est requis.');
      return;
    }
    if (!formData.description.trim()) {
      showError('Erreur de validation', 'La description est requise.');
      return;
    }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      showError('Erreur de validation', 'Le montant total doit être supérieur à 0.');
      return;
    }

    try {
      showLoading(
        editingFacture ? 'Modification en cours...' : 'Création en cours...',
        editingFacture ? 'Modification de la facture' : 'Création de la nouvelle facture'
      );

      const factureData = {
        ...formData,
        laborCost: formData.laborCost ? parseFloat(formData.laborCost) : null,
        materialCost: formData.materialCost ? parseFloat(formData.materialCost) : null,
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : null,
        interventionId: formData.interventionId ? parseInt(formData.interventionId) : null,
        price: formData.totalAmount ? parseFloat(formData.totalAmount) : null
      };

      if (editingFacture) {
        await apiService.updateFacture(editingFacture.id, factureData);
      } else {
        await apiService.createFacture(factureData);
      }

      closeLoading();
      setIsModalOpen(false);
      await loadData();

      showSuccess(
        editingFacture ? 'Facture modifiée !' : 'Facture créée !',
        editingFacture
          ? 'La facture a été modifiée avec succès.'
          : 'La nouvelle facture a été créée avec succès.'
      );
    } catch (err) {
      closeLoading();
      console.error('Error saving facture:', err);

      if (err.message.includes('duplicate') || err.message.includes('unique')) {
        showError(
          'Erreur de validation',
          'Ce numéro de facture existe déjà. Veuillez utiliser un numéro différent.'
        );
      } else if (err.message.includes('fetch')) {
        showNetworkError();
      } else {
        showError(
          editingFacture ? 'Erreur de modification' : 'Erreur de création',
          'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.'
        );
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };

      if (name === 'laborCost' || name === 'materialCost') {
        const laborCost = parseFloat(name === 'laborCost' ? value : updated.laborCost) || 0;
        const materialCost = parseFloat(name === 'materialCost' ? value : updated.materialCost) || 0;
        updated.totalAmount = (laborCost + materialCost).toFixed(2);
      }

      return updated;
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case INVOICE_STATUS.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case INVOICE_STATUS.SENT:
        return 'bg-blue-100 text-blue-800';
      case INVOICE_STATUS.PAID:
        return 'bg-green-100 text-green-800';
      case INVOICE_STATUS.OVERDUE:
        return 'bg-red-100 text-red-800';
      case INVOICE_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === INVOICE_STATUS.PAID || status === INVOICE_STATUS.CANCELLED) {
      return false;
    }
    const now = new Date();
    const due = new Date(dueDate);
    return due < now;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      CASH: 'Espèces',
      CREDIT_CARD: 'Carte bancaire',
      BANK_TRANSFER: 'Virement',
      CHECK: 'Chèque'
    };
    return labels[method] || method;
  };

  const getInterventionInfo = (facture) => {
    const intervention = interventions.find(i => i.facture && i.facture.id === facture.id);

    if (intervention) {
      const clientName = intervention.contract?.client
        ? `${intervention.contract.client.firstName} ${intervention.contract.client.lastName}`
        : 'Client inconnu';

      return {
        title: intervention.title,
        description: intervention.description,
        client: clientName,
        scheduledTime: intervention.scheduledTime
      };
    }

    if (facture.interventionId) {
      const interventionById = interventions.find(i => i.id === facture.interventionId);
      if (interventionById) {
        const clientName = interventionById.contract?.client
          ? `${interventionById.contract.client.firstName} ${interventionById.contract.client.lastName}`
          : 'Client inconnu';

        return {
          title: interventionById.title,
          description: interventionById.description,
          client: clientName,
          scheduledTime: interventionById.scheduledTime
        };
      }
    }

    return null;
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
          <h2 className="text-2xl font-ubuntu-bold text-primary-900">Gestion des Factures</h2>
          <p className="text-primary-600 font-ubuntu">Gérez vos factures, paiements et suivi financier</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-ubuntu-medium transition-colors flex items-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nouvelle Facture</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Factures table */}
      <div className="bg-white rounded-lg shadow-lg border border-primary-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-100">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Facture
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Intervention
                </th>
                <th className="px-6 py-3 text-right text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-100">
              {factures.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-primary-500 font-ubuntu">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                factures.map((facture) => {
                  const interventionInfo = getInterventionInfo(facture);
                  return (
                    <tr key={facture.id} className="hover:bg-primary-25 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-ubuntu-medium text-primary-900">
                            #{facture.invoiceNumber || facture.id}
                          </div>
                          <div className="text-sm text-primary-600 font-ubuntu">
                            {facture.createdAt && new Date(facture.createdAt).toLocaleDateString('fr-MA')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-primary-700 font-ubuntu max-w-xs">
                        <div className="truncate" title={facture.description}>
                          {facture.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-primary-900 font-ubuntu-medium">
                          {formatCurrency(facture.totalAmount || facture.price)}
                        </div>
                        {(facture.laborCost || facture.materialCost) && (
                          <div className="text-sm text-primary-500 font-ubuntu">
                            {facture.laborCost && `Main d'œuvre: ${formatCurrency(facture.laborCost)}`}
                            {facture.laborCost && facture.materialCost && ' • '}
                            {facture.materialCost && `Matériel: ${formatCurrency(facture.materialCost)}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`px-2 py-1 text-xs rounded-full font-ubuntu-medium ${getStatusBadgeColor(facture.status)}`}>
                            {getInvoiceStatusLabel(facture.status)}
                          </span>
                          {isOverdue(facture.dueDate, facture.status) && (
                            <span className="text-xs text-red-600 font-ubuntu-medium">
                              En retard
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-primary-700 font-ubuntu text-sm">
                        {facture.dueDate ? new Date(facture.dueDate).toLocaleDateString('fr-MA') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-primary-700 font-ubuntu text-sm">
                        <div>
                          {facture.paidDate ? (
                            <div>
                              <div className="text-green-600 font-ubuntu-medium">
                                {new Date(facture.paidDate).toLocaleDateString('fr-MA')}
                              </div>
                              {facture.paymentMethod && (
                                <div className="text-xs text-primary-500">
                                  {getPaymentMethodLabel(facture.paymentMethod)}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-primary-700 font-ubuntu text-sm">
                        {interventionInfo ? (
                          <div>
                            <div className="font-ubuntu-medium">{interventionInfo.title}</div>
                            <div className="text-xs text-primary-500">{interventionInfo.description}</div>
                            <div className="text-xs text-primary-500">
                              {interventionInfo.client}
                            </div>
                            <div className="text-xs text-primary-500">
                              {interventionInfo.scheduledTime ? new Date(interventionInfo.scheduledTime).toLocaleDateString('fr-MA') : '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-primary-500 font-ubuntu">Aucune intervention</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(facture)}
                          className="text-primary-600 hover:text-primary-900 font-ubuntu-medium"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDelete(facture.id)}
                          className="text-red-600 hover:text-red-900 font-ubuntu-medium ml-4"
                        >
                          <FontAwesomeIcon icon={faTrash} />
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
        title={editingFacture ? 'Modifier la Facture' : 'Nouvelle Facture'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Number and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Numéro de facture
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                placeholder="INV-2024-001"
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              />
            </div>
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              >
                {Object.entries(INVOICE_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {getInvoiceStatusLabel(value)}
                  </option>
                ))}
              </select>
            </div>
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
              placeholder="Description des services ou produits facturés..."
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            />
          </div>

          {/* Cost Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Coût de la main d'œuvre (MAD)
              </label>
              <input
                type="number"
                step="0.01"
                name="laborCost"
                value={formData.laborCost}
                onChange={handleInputChange}
                placeholder="500.00"
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              />
            </div>
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Coût du matériel (MAD)
              </label>
              <input
                type="number"
                step="0.01"
                name="materialCost"
                value={formData.materialCost}
                onChange={handleInputChange}
                placeholder="200.00"
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              />
            </div>
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Montant total (MAD) *
              </label>
              <input
                type="number"
                step="0.01"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleInputChange}
                required
                placeholder="200.00"
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Date d'échéance
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              />
            </div>
            <div>
              <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                Date de paiement
              </label>
              <input
                type="date"
                name="paidDate"
                value={formData.paidDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Méthode de paiement
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            >
              <option value="">Sélectionner une méthode</option>
              {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                <option key={key} value={value}>
                  {getPaymentMethodLabel(value)}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Notes additionnelles sur la facture..."
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            />
          </div>

          {/* Intervention */}
          <div>
            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
              Intervention associée
            </label>
            <select
              name="interventionId"
              value={formData.interventionId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
            >
              <option value="">Sélectionner une intervention</option>
              {interventions.map(intervention => {
                const clientName = intervention.contract?.client
                  ? `${intervention.contract.client.firstName} ${intervention.contract.client.lastName}`
                  : 'Client inconnu';
                const hasInvoice = intervention.facture ? ' (Facture existante)' : '';
                return (
                  <option key={intervention.id} value={intervention.id}>
                    {intervention.title} - {clientName}{hasInvoice}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-primary-500 mt-1">
              Sélectionnez l'intervention pour laquelle cette facture est créée
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
              {editingFacture ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FacturesPage;