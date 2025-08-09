import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import apiService from '../services/api';
import {
    TECHNICIAN_SPECIALIZATIONS,
    getTechnicianSpecializationLabel
} from '../services/constants';
import {
    showSuccess,
    showError,
    showConfirmation,
    showLoading,
    closeLoading,
    showNetworkError
} from '../services/alerts';

const TechniciansPage = () => {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTechnician, setEditingTechnician] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        employeeId: '',
        specialization: TECHNICIAN_SPECIALIZATIONS.GENERAL
    });

    useEffect(() => {
        loadTechnicians();
    }, []);

    const loadTechnicians = async () => {
        try {
            setLoading(true);
            const data = await apiService.getTechnicians();
            setTechnicians(data);
            setError(null);
        } catch (err) {
            setError('Erreur lors du chargement des techniciens');
            console.error('Error loading technicians:', err);
            if (err.message.includes('fetch')) {
                showNetworkError();
            } else {
                showError('Erreur de chargement', 'Impossible de charger la liste des techniciens.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTechnician(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            employeeId: '',
            specialization: TECHNICIAN_SPECIALIZATIONS.GENERAL
        });
        setIsModalOpen(true);
    };

    const handleEdit = (technician) => {
        setEditingTechnician(technician);
        setFormData({
            firstName: technician.firstName || '',
            lastName: technician.lastName || '',
            email: technician.email || '',
            phoneNumber: technician.phoneNumber || '',
            employeeId: technician.employeeId || '',
            specialization: technician.specialization || TECHNICIAN_SPECIALIZATIONS.GENERAL
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const technician = technicians.find(t => t.id === id);
        const technicianName = technician ? `${technician.firstName} ${technician.lastName}` : `Technicien #${id}`;

        try {
            const result = await showConfirmation(
                'Supprimer le technicien',
                `Êtes-vous sûr de vouloir supprimer ${technicianName} ?`,
                'Oui, supprimer',
                'Annuler'
            );

            if (result.isConfirmed) {
                showLoading('Suppression en cours...', 'Suppression du technicien');

                await apiService.deleteTechnician(id);

                closeLoading();
                await loadTechnicians();

                showSuccess(
                    'Technicien supprimé !',
                    `${technicianName} a été supprimé avec succès.`
                );
            }
        } catch (err) {
            closeLoading();
            console.error('Error deleting technician:', err);

            if (err.message.includes('constraint') || err.message.includes('foreign key')) {
                showError(
                    'Impossible de supprimer ce technicien',
                    'Une erreur s\'est produite. Ce technicien a des ressources attachées (contrats, interventions). Veuillez supprimer ces ressources avant de supprimer le technicien.'
                );
            } else if (err.message.includes('fetch')) {
                showNetworkError();
            } else {
                showError(
                    'Erreur de suppression',
                    'Une erreur est survenue lors de la suppression du technicien. Veuillez réessayer.'
                );
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.employeeId.trim()) {
            showError('Erreur de validation', 'Tous les champs obligatoires doivent être remplis.');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            showError('Erreur de validation', 'L\'email n\'est pas valide.');
            return;
        }

        try {
            showLoading(
                editingTechnician ? 'Modification en cours...' : 'Création en cours...',
                'Sauvegarde des informations technicien'
            );

            if (editingTechnician) {
                await apiService.updateTechnician(editingTechnician.id, formData);
            } else {
                await apiService.createTechnician(formData);
            }

            closeLoading();
            setIsModalOpen(false);
            await loadTechnicians();

            showSuccess(
                editingTechnician ? 'Technicien modifié !' : 'Technicien créé !',
                editingTechnician
                    ? `Les informations de ${formData.firstName} ${formData.lastName} ont été mises à jour.`
                    : `${formData.firstName} ${formData.lastName} a été ajouté avec succès.`
            );

        } catch (err) {
            closeLoading();
            console.error('Error saving technician:', err);

            if (err.message.includes('duplicate') || err.message.includes('unique')) {
                showError(
                    'Technicien déjà existant',
                    'Un technicien avec cette adresse email ou cet ID employé existe déjà.'
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
                    editingTechnician ? 'Erreur de modification' : 'Erreur de création',
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

    const getStatusBadgeColor = (isActive) => {
        return isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
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
                    <h2 className="text-2xl font-ubuntu-bold text-primary-900">Gestion des Techniciens</h2>
                    <p className="text-primary-600 font-ubuntu">Gérez votre équipe de techniciens de maintenance</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-ubuntu-medium transition-colors flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Nouveau Technicien</span>
                </button>
            </div>

            {/* Technicians table */}
            <div className="bg-white rounded-lg shadow-lg border border-primary-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-primary-100">
                        <thead className="bg-primary-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Technicien
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    ID Employé
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Spécialisation
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-ubuntu-bold text-primary-900 uppercase tracking-wider">
                                    Statut
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
                            {technicians.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-primary-500 font-ubuntu">
                                        Aucun technicien trouvé
                                    </td>
                                </tr>
                            ) : (
                                technicians.map((technician) => (
                                    <tr key={technician.id} className="hover:bg-primary-25 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="font-ubuntu-medium text-primary-900">
                                                    {technician.firstName} {technician.lastName}
                                                </div>
                                                <div className="text-sm text-primary-500 font-ubuntu">
                                                    ID: {technician.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-primary-700 font-ubuntu">
                                                    {technician.email}
                                                </div>
                                                <div className="text-sm text-primary-500 font-ubuntu">
                                                    {technician.phoneNumber}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-primary-700 font-ubuntu font-medium">
                                                {technician.employeeId}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800 font-ubuntu-medium">
                                                {getTechnicianSpecializationLabel(technician.specialization)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full font-ubuntu-medium ${getStatusBadgeColor(technician.isActive !== undefined ? technician.isActive : true)}`}>
                                                {(technician.isActive !== undefined ? technician.isActive : true) ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-primary-700 font-ubuntu">
                                                {formatDate(technician.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(technician)}
                                                className="text-primary-600 hover:text-primary-900 font-ubuntu-medium"
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => handleDelete(technician.id)}
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
                title={editingTechnician ? 'Modifier le Technicien' : 'Nouveau Technicien'}
                size="lg"
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
                                placeholder="Jean"
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
                                placeholder="Dupont"
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
                            placeholder="jean.dupont@maintenance.com"
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

                    {/* Employee ID and Specialization */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                ID Employé *
                            </label>
                            <input
                                type="text"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleInputChange}
                                required
                                placeholder="TECH003"
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-ubuntu-medium text-primary-700 mb-2">
                                Spécialisation
                            </label>
                            <select
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-ubuntu"
                            >
                                {Object.entries(TECHNICIAN_SPECIALIZATIONS).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {getTechnicianSpecializationLabel(value)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Info message */}
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-ubuntu-medium">Informations technicien</p>
                                <p className="text-sm font-ubuntu">
                                    Ce technicien pourra être assigné à des contrats et interventions de maintenance.
                                    Tous les champs sont requis pour créer un profil technicien complet.
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
                            {editingTechnician ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TechniciansPage; 