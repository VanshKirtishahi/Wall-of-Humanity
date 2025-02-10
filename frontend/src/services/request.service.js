import api from './api';

class RequestService {
  async createRequest(requestData) {
    try {
      const response = await api.post('/api/requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Create request error:', error);
      throw error;
    }
  }

  async getMyRequests() {
    try {
      const response = await api.get('/api/requests/my-requests');
      return response.data;
    } catch (error) {
      console.error('Get my requests error:', error);
      throw error;
    }
  }

  async getDonationRequests(donationId) {
    const response = await api.get(`/requests/donation/${donationId}`);
    return response.data;
  }

  async updateRequestStatus(requestId, status) {
    try {
      const response = await api.put(`/api/requests/${requestId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update request status error:', error);
      throw error;
    }
  }

  async deleteRequest(requestId) {
    const response = await api.delete(`/requests/${requestId}`);
    return response.data;
  }
}

export default new RequestService(); 