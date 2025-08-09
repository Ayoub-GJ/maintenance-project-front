import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import apiService from '../services/api';
import {
    EQUIPMENT_TYPES,
    EQUIPMENT_STATUS,
    getEquipmentTypeLabel,
    getEquipmentStatusLabel
} from '../services/constants';
import {
    showSuccess,
    showError,
    showCascadeDeleteConfirmation,
    showLoading,
    closeLoading,
    showNetworkError,
    showConfirmation
} from '../services/alerts';

const EquipmentPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [formData, setFormData] = useState({
        equipmentCode: '',
        name: '',
        model: '',
        manufacturer: '',
        serialNumber: '',
        installationDate: '',
        warrantyExpiryDate: '',
        status: EQUIPMENT_STATUS.OPERATIONAL,
        type: '',
        location: '',
        description: '',
        specifications: '',
        clientId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [equipmentData, clientsData] = await Promise.all([
                apiService.getEquipment(),
                apiService.getClients()
            ]);
            setEquipment(equipmentData);
            setClients(clientsData);
            setError(null);
        } catch (err) {
            setError('Erreur lors du chargement des équipements');
            console.error('Error loading equipment:', err);
            if (err.message.includes('fetch')) {
                showNetworkError();
            } else {
                showError('Erreur de chargement', 'Impossible de charger la liste des équipements.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getClientName = (equipment) => {
        if (equipment.client) {
            return `${equipment.client.firstName} ${equipment.client.lastName}`;
        }
        if (equipment.clientId) {
            const client = clients.find(c => c.clientId === equipment.clientId);
            if (client) {
                return `${client.firstName} ${client.lastName}`;
            }
        }
        return 'Client inconnu';
    };

    const handleCreate = () => {
        setEditingEquipment(null);
        setFormData({
            equipmentCode: '',
            name: '',
            model: '',
            manufacturer: '',
            serialNumber: '',
            installationDate: '',
            warrantyExpiryDate: '',
            status: EQUIPMENT_STATUS.OPERATIONAL,
            type: '',
            location: '',
            description: '',
            specifications: '',
            clientId: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (equipmentItem) => {
        setEditingEquipment(equipmentItem);
        setFormData({
            equipmentCode: equipmentItem.equipmentCode || '',
            name: equipmentItem.name || '',
            model: equipmentItem.model || '',
            manufacturer: equipmentItem.manufacturer || '',
            serialNumber: equipmentItem.serialNumber || '',
            installationDate: equipmentItem.installationDate ? equipmentItem.installationDate.split('T')[0] : '',
            warrantyExpiryDate: equipmentItem.warrantyExpiryDate ? equipmentItem.warrantyExpiryDate.split('T')[0] : '',
            status: equipmentItem.status || EQUIPMENT_STATUS.OPERATIONAL,
            type: equipmentItem.type || '',
            location: equipmentItem.location || '',
            description: equipmentItem.description || '',
            specifications: equipmentItem.specifications || '',
            clientId: equipmentItem.clientId || (equipmentItem.client ? equipmentItem.client.clientId : '')
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const equipmentItem = equipment.find(e => e.id === id);
        const equipmentName = equipmentItem ? equipmentItem.name : `Équipement #${id}`;
        const clientName = equipmentItem ? getClientName(equipmentItem) : 'Client inconnu';

        try {
            const result = await showConfirmation(
                'Supprimer l\'équipement',
                `Êtes-vous sûr de vouloir supprimer "${equipmentName}" ?`,
                'Oui, supprimer',
                'Annuler'
            );

            if (result.isConfirmed) {
                showLoading('Suppression en cours...', 'Suppression de l\'équipement');

                await apiService.deleteEquipment(id);

                closeLoading();
                await loadData();

                showSuccess(
                    'Équipement supprimé !',
                    `${equipmentName} a été supprimé avec succès.`
                );
            }
        } catch (err) {
            closeLoading();
            console.error('Error deleting equipment:', err);

            if (err.message.includes('constraint') || err.message.includes('foreign key')) {
                showError(
                    'Impossible de supprimer cet équipement',
                    'Une erreur s\'est produite. Cet équipement a des ressources attachées (interventions). Veuillez supprimer ces ressources avant de supprimer l\'équipement.'
                );
            } else if (err.message.includes('fetch')) {
                showNetworkError();
            } else {
                showError(
                    'Erreur de suppression',
                    'Une erreur est survenue lors de la suppression de l\'équipement. Veuillez réessayer.'
                );
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.clientId) {
            showError('Erreur de validation', 'Le nom et le client sont requis.');
            return;
        }

        try {
            showLoading(
                editingEquipment ? 'Modification en cours...' : 'Création en cours...',
                'Sauvegarde de l\'équipement'
            );

            const equipmentData = {
                ...formData,
                clientId: formData.clientId ? parseInt(formData.clientId) : null
            };

            if (editingEquipment) {
                await apiService.updateEquipment(editingEquipment.id, equipmentData);
            } else {
                await apiService.createEquipment(equipmentData);
            }

            closeLoading();
            setIsModalOpen(false);
            await loadData();

            const clientName = clients.find(c => c.clientId === parseInt(formData.clientId));
            const clientDisplayName = clientName ? `${clientName.firstName} ${clientName.lastName}` : 'le client sélectionné';

            showSuccess(
                editingEquipment ? 'Équipement modifié !' : 'Équipement créé !',
                editingEquipment
                    ? `L'équipement "${formData.name}" a été mis à jour.`
                    : `L'équipement "${formData.name}" a été ajouté pour ${clientDisplayName}.`
            );

        } catch (err) {
            closeLoading();
            console.error('Error saving equipment:', err);

            if (err.message.includes('duplicate') || err.message.includes('unique')) {
                showError(
                    'Équipement déjà existant',
                    'Un équipement avec ce code ou numéro de série existe déjà.'
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
                    editingEquipment ? 'Erreur de modification' : 'Erreur de création',
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

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case EQUIPMENT_STATUS.OPERATIONAL:
                return 'bg-green-100 text-green-800';
            case EQUIPMENT_STATUS.MAINTENANCE_REQUIRED:
                return 'bg-yellow-100 text-yellow-800';
            case EQUIPMENT_STATUS.OUT_OF_SERVICE:
                return 'bg-red-100 text-red-800';
            case EQUIPMENT_STATUS.DECOMMISSIONED:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const isWarrantyExpiringSoon = (warrantyExpiryDate) => {
        if (!warrantyExpiryDate) return false;
        const now = new Date();
        const expiry = new Date(warrantyExpiryDate);
        const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
        return diffDays <= 90 && diffDays > 0;
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
                    <h2 className="text-2xl font-ubuntu-bold text-primary-900">Gestion des Équipements</h2>
                    <p className="text-primary-600 font-ubuntu">Gérez votre inventaire d'équipements et leur maintenance</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-ubuntu-medium transition-colors flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Nouvel Équipement</span>
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Equipment table */}
            <div className="bg-white rounded-lg shadow-lg border border-primary-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-primary-100">
                        <thead className="bg-primary-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Équipement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Client
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Localisation
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Fabricant
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-primary-100">
                            {equipment.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-primary-500 font-ubuntu">
                                        Aucun équipement trouvé
                                    </td>
                                </tr>
                            ) : (
                                equipment.map((item) => (
                                    <tr key={item.id} className="hover:bg-primary-25 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="font-ubuntu-medium text-primary-900">
                                                    {item.name}
                                                </div>
                                                <div className="text-sm text-primary-600 font-ubuntu">
                                                    {item.equipmentCode && `Code: ${item.equipmentCode}`}
                                                </div>
                                                <div className="text-sm text-primary-500 font-ubuntu">
                                                    {item.model && `${item.model} - `}
                                                    {item.serialNumber && `S/N: ${item.serialNumber}`}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-primary-700 font-ubuntu">
                                            {getClientName(item)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800 font-ubuntu-medium">
                                                {getEquipmentTypeLabel(item.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <span className={`px-2 py-1 text-xs rounded-full font-ubuntu-medium ${getStatusBadgeColor(item.status)}`}>
                                                    {getEquipmentStatusLabel(item.status)}
                                                </span>
                                                {isWarrantyExpiringSoon(item.warrantyExpiryDate) && (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-ubuntu-medium">
                                                        Garantie expire
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-primary-700 font-ubuntu">
                                            {item.location || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-primary-700 font-ubuntu">
                                                {item.manufacturer || '-'}
                                            </div>
                                            <div className="text-sm text-primary-500 font-ubuntu">
                                                {item.model || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-primary-600 hover:text-primary-900 font-ubuntu-medium"
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-900 font-ubuntu-medium ml-4"
                                            >
                                                Supprimer
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
                title={editingEquipment ? 'Modifier l\'Équipement' : 'Nouvel Équipement'}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Equipment Code and Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Code équipement
                            </label>
                            <input
                                type="text"
                                name="equipmentCode"
                                value={formData.equipmentCode}
                                onChange={handleInputChange}
                                placeholder="EQ-2024-001"
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Nom de l'équipement *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="Compresseur industriel"
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            />
                        </div>
                    </div>

                    {/* Client Assignment */}
                    <div>
                        <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                            Client propriétaire *
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
                    </div>

                    {/* Type and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Type d'équipement
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            >
                                {Object.entries(EQUIPMENT_TYPES).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {getEquipmentTypeLabel(value)}
                                    </option>
                                ))}
                            </select>
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
                                {Object.entries(EQUIPMENT_STATUS).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {getEquipmentStatusLabel(value)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Fabricant
                            </label>
                            <input
                                type="text"
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleInputChange}
                                placeholder="CompressAir Industries"
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Modèle
                            </label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleInputChange}
                                placeholder="IC-5000X"
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Numéro de série
                            </label>
                            <input
                                type="text"
                                name="serialNumber"
                                value={formData.serialNumber}
                                onChange={handleInputChange}
                                placeholder="SN-789456123"
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                            Localisation
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Bâtiment A - Étage 2"
                            className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Date d'installation
                            </label>
                            <input
                                type="date"
                                name="installationDate"
                                value={formData.installationDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Expiration de la garantie
                            </label>
                            <input
                                type="date"
                                name="warrantyExpiryDate"
                                value={formData.warrantyExpiryDate}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Description détaillée de l'équipement..."
                            className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                        />
                    </div>

                    {/* Specifications */}
                    <div>
                        <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                            Spécifications techniques
                        </label>
                        <textarea
                            name="specifications"
                            value={formData.specifications}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="500 PSI, 220V, 50HP motor..."
                            className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                        />
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
                            {editingEquipment ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EquipmentPage; 