import Swal from 'sweetalert2';

export const showSuccess = (title, text = '') => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: true,
        allowOutsideClick: true
    });
};

export const showError = (title, text = '') => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
        showConfirmButton: true,
        allowOutsideClick: true
    });
};

export const showWarning = (title, text = '') => {
    return Swal.fire({
        icon: 'warning',
        title: title,
        text: text,
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
        showConfirmButton: true,
        allowOutsideClick: true
    });
};

export const showConfirmation = (title, text, confirmText = 'Oui, supprimer', cancelText = 'Annuler') => {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        focusCancel: true
    });
};

export const showCascadeDeleteConfirmation = (entityType, entityName, cascadeInfo) => {
    return Swal.fire({
        title: `Supprimer ${entityType}`,
        html: `
      <div class="text-left">
        <p class="mb-3"><strong>Vous êtes sur le point de supprimer :</strong></p>
        <p class="mb-4 text-blue-600 font-medium">${entityName}</p>
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p class="text-red-800 font-medium mb-2">⚠️ Attention - Suppression en cascade</p>
          <p class="text-red-700 text-sm">${cascadeInfo}</p>
        </div>
        <p class="text-gray-600 text-sm">Cette action est irréversible.</p>
      </div>
    `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Oui, supprimer définitivement',
        cancelButtonText: 'Annuler',
        reverseButtons: true,
        focusCancel: true,
        width: '500px'
    });
};

export const showLoading = (title = 'Chargement...', text = 'Veuillez patienter') => {
    return Swal.fire({
        title: title,
        text: text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

export const closeLoading = () => {
    Swal.close();
};

export const showNetworkError = () => {
    return showError(
        'Erreur de connexion',
        'Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.'
    );
};

export const showValidationError = (errors) => {
    const errorList = Array.isArray(errors)
        ? errors.map(error => `• ${error}`).join('<br>')
        : errors;

    return Swal.fire({
        icon: 'error',
        title: 'Erreur de validation',
        html: `<div class="text-left">${errorList}</div>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
    });
}; 