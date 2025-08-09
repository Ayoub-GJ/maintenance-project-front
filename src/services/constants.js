export const CLIENT_TYPES = {
    INDIVIDUAL: 'INDIVIDUAL',
    COMPANY: 'COMPANY',
    GOVERNMENT: 'GOVERNMENT',
    NON_PROFIT: 'NON_PROFIT'
};

export const CLIENT_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED'
};

export const CONTRACT_TYPES = {
    MAINTENANCE: 'MAINTENANCE',
    REPAIR: 'REPAIR',
    INSTALLATION: 'INSTALLATION',
    CONSULTING: 'CONSULTING',
    EMERGENCY: 'EMERGENCY',
    SEASONAL: 'SEASONAL'
};

export const CONTRACT_STATUS = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    EXPIRED: 'EXPIRED',
    CANCELLED: 'CANCELLED'
};

export const INTERVENTION_STATUS = {
    SCHEDULED: 'SCHEDULED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    POSTPONED: 'POSTPONED'
};

export const INTERVENTION_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT'
};

export const INTERVENTION_TYPES = {
    PREVENTIVE: 'PREVENTIVE',
    CORRECTIVE: 'CORRECTIVE',
    EMERGENCY: 'EMERGENCY',
    INSPECTION: 'INSPECTION',
    INSTALLATION: 'INSTALLATION'
};

export const INVOICE_STATUS = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED'
};

export const PAYMENT_METHODS = {
    CASH: 'CASH',
    CREDIT_CARD: 'CREDIT_CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CHECK: 'CHECK'
};

export const EQUIPMENT_STATUS = {
    OPERATIONAL: 'OPERATIONAL',
    MAINTENANCE_REQUIRED: 'MAINTENANCE_REQUIRED',
    OUT_OF_SERVICE: 'OUT_OF_SERVICE',
    DECOMMISSIONED: 'DECOMMISSIONED'
};

export const EQUIPMENT_TYPES = {
    HVAC: 'HVAC',
    ELECTRICAL: 'ELECTRICAL',
    PLUMBING: 'PLUMBING',
    MECHANICAL: 'MECHANICAL',
    SAFETY: 'SAFETY',
    IT: 'IT'
};

export const TECHNICIAN_SPECIALIZATIONS = {
    GENERAL: 'GENERAL',
    ELECTRICAL: 'ELECTRICAL',
    PLUMBING: 'PLUMBING',
    HVAC: 'HVAC',
    MECHANICAL: 'MECHANICAL',
    IT_SUPPORT: 'IT_SUPPORT'
};

export function getClientTypeLabel(type) {
    if (type === 'INDIVIDUAL') return 'Particulier';
    if (type === 'COMPANY') return 'Entreprise';
    if (type === 'GOVERNMENT') return 'Administration';
    if (type === 'NON_PROFIT') return 'Association';
    return type;
}

export function getInvoiceStatusLabel(status) {
    if (status === 'DRAFT') return 'Brouillon';
    if (status === 'SENT') return 'Envoyée';
    if (status === 'PAID') return 'Payée';
    if (status === 'OVERDUE') return 'En retard';
    if (status === 'CANCELLED') return 'Annulée';
    return status;
}

export function getTechnicianSpecializationLabel(specialization) {
    if (specialization === 'GENERAL') return 'Maintenance générale';
    if (specialization === 'ELECTRICAL') return 'Systèmes électriques';
    if (specialization === 'PLUMBING') return 'Plomberie';
    if (specialization === 'HVAC') return 'CVC (Chauffage, Ventilation, Climatisation)';
    if (specialization === 'MECHANICAL') return 'Systèmes mécaniques';
    if (specialization === 'IT_SUPPORT') return 'Support informatique';
    return specialization;
}

export function getEquipmentStatusLabel(status) {
    if (status === 'OPERATIONAL') return 'Opérationnel';
    if (status === 'MAINTENANCE_REQUIRED') return 'Maintenance requise';
    if (status === 'OUT_OF_SERVICE') return 'Hors service';
    if (status === 'DECOMMISSIONED') return 'Déclassé';
    return status;
}

export function getEquipmentTypeLabel(type) {
    if (type === 'HVAC') return 'CVC';
    if (type === 'ELECTRICAL') return 'Électrique';
    if (type === 'PLUMBING') return 'Plomberie';
    if (type === 'MECHANICAL') return 'Mécanique';
    if (type === 'SAFETY') return 'Sécurité';
    if (type === 'IT') return 'Informatique';
    return type;
} 