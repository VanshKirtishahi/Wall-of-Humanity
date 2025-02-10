import api from './api';

class DonationService {
  async getAllDonations() {
    try {
      const response = await api.get('/api/donations');
      return response.data;
    } catch (error) {
      console.error('Get all donations error:', error);
      throw error.response?.data || { message: 'Error fetching donations' };
    }
  }

  async getMyDonations() {
    try {
      const response = await api.get('/api/donations/my-donations');
      return response.data;
    } catch (error) {
      console.error('Get my donations error:', error);
      throw error;
    }
  }

  async getDonationById(id) {
    try {
      const response = await api.get(`/api/donations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get donation error:', error);
      throw error;
    }
  }

  async createDonation(formData) {
    try {
      const response = await api.post('/api/donations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Create donation error:', error);
      throw error.response?.data || { message: 'Error creating donation' };
    }
  }

  async updateDonation(id, formData) {
    try {
      const response = await api.put(`/api/donations/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Update donation error:', error);
      throw error;
    }
  }

  async deleteDonation(id) {
    try {
      const response = await api.delete(`/api/donations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete donation error:', error);
      throw error;
    }
  }

  async createDonationWithImage(formData) {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Authentication required');
      }

      const user = JSON.parse(userData);
      if (!user.token) {
        throw new Error('Authentication required');
      }

      formData.append('userId', user._id);
      formData.append('user', user._id);

      const response = await api.post('/api/donations', formData, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Create donation with image error:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get('/api/donations/stats');
      
      if (!response.data) {
        throw new Error('No data received');
      }

      return {
        totalDonations: response.data.totalDonations || 0,
        ngoCount: response.data.ngoCount || 0,
        volunteerCount: response.data.volunteerCount || 0,
        userCount: response.data.userCount || 0,
        requestCount: response.data.requestCount || 0
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}

// Create and export a single instance
const donationService = new DonationService();
export default donationService; 