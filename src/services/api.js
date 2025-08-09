const API_BASE_URL = 'http://localhost:8080/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      throw error;
    }
  }

  async getClients() {
    return this.request('/clients');
  }

  async getClient(id) {
    return this.request(`/clients/${id}`);
  }

  async createClient(clientData) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(id, clientData) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id) {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async getContracts() {
    return this.request('/contracts');
  }

  async getContract(id) {
    return this.request(`/contracts/${id}`);
  }

  async createContract(contractData) {
    return this.request('/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  async updateContract(id, contractData) {
    return this.request(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contractData),
    });
  }

  async deleteContract(id) {
    return this.request(`/contracts/${id}`, {
      method: 'DELETE',
    });
  }

  async getFactures() {
    return this.request('/factures');
  }

  async getFacture(id) {
    return this.request(`/factures/${id}`);
  }

  async createFacture(factureData) {
    return this.request('/factures', {
      method: 'POST',
      body: JSON.stringify(factureData),
    });
  }

  async updateFacture(id, factureData) {
    return this.request(`/factures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(factureData),
    });
  }

  async deleteFacture(id) {
    return this.request(`/factures/${id}`, {
      method: 'DELETE',
    });
  }

  async getChiffreAffaires() {
    return this.request('/factures/chiffre-affaires');
  }

  async getInterventions() {
    return this.request('/interventions');
  }

  async getIntervention(id) {
    return this.request(`/interventions/${id}`);
  }

  async createIntervention(interventionData) {
    return this.request('/interventions', {
      method: 'POST',
      body: JSON.stringify(interventionData),
    });
  }

  async updateIntervention(id, interventionData) {
    return this.request(`/interventions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(interventionData),
    });
  }

  async deleteIntervention(id) {
    return this.request(`/interventions/${id}`, {
      method: 'DELETE',
    });
  }

  async getUpcomingInterventions() {
    return this.request('/interventions/upcoming');
  }

  async getEquipment() {
    return this.request('/equipment');
  }

  async getEquipmentItem(id) {
    return this.request(`/equipment/${id}`);
  }

  async createEquipment(equipmentData) {
    return this.request('/equipment', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    });
  }

  async updateEquipment(id, equipmentData) {
    return this.request(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    });
  }

  async deleteEquipment(id) {
    return this.request(`/equipment/${id}`, {
      method: 'DELETE',
    });
  }

  async getTechnicians() {
    return this.request('/techniciens');
  }

  async getTechnician(id) {
    return this.request(`/techniciens/${id}`);
  }

  async createTechnician(technicianData) {
    return this.request('/techniciens', {
      method: 'POST',
      body: JSON.stringify(technicianData),
    });
  }

  async updateTechnician(id, technicianData) {
    return this.request(`/techniciens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(technicianData),
    });
  }

  async deleteTechnician(id) {
    return this.request(`/techniciens/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();