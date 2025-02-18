import api from '../config/axios';

class DonationService {
  async getAllDonations() {
    try {
      const response = await api.get('/donations');
      console.log('Donations response:', response);
      return response.data;
    } catch (error) {
      console.error('Fetch donations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch donations');
    }
  }

  async getMyDonations() {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Authentication required');
      }

      const user = JSON.parse(userData);
      if (!user || !user.token) {
        localStorage.removeItem('user');
        throw new Error('Authentication required');
      }

      const response = await api.get('/donations/my-donations', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Get my donations error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
      }
      throw new Error('Authentication required');
    }
  }

  async getDonationById(id) {
    try {
      const response = await api.get(`/donations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get donation error:', error);
      throw error;
    }
  }

  async createDonation(formData) {
    try {
      const response = await api.post('/donations', formData);
      return response.data;
    } catch (error) {
      console.error('Create donation error:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw error;
    }
  }

  async updateDonation(id, formData) {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      if (!token) throw new Error('Authentication required');

      const response = await api.put(`/api/donations/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        throw new Error('Authentication required');
      }
      throw error;
    }
  }

  async deleteDonation(id) {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Authentication required');
      }

      const user = JSON.parse(userData);
      if (!user.token) {
        throw new Error('Authentication required');
      }

      const response = await api.delete(`/donations/${id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to delete donation');
    }
  }

  async createDonationWithImage(formData) {
    try {
      if (!(formData instanceof FormData)) {
        throw new Error('Invalid form data format');
      }

      // Validate form data
      const requiredFields = ['title', 'description', 'quantity', 'location'];
      for (let field of requiredFields) {
        if (!formData.get(field)) {
          throw new Error(`${field} is required`);
        }
      }

      // Log form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? 'File' : value);
      }

      const response = await api.post('/donations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        validateStatus: status => status < 500
      });

      if (response.status === 400) {
        throw new Error(response.data.message || 'Validation error');
      }

      if (!response.data) {
        throw new Error('No response data received');
      }

      return response.data;
    } catch (error) {
      console.error('Create donation error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        throw new Error('Authentication required');
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to create donation');
    }
  }

  async getStats() {
    try {
      const response = await api.get('/donations/stats'); 
      
      if (!response.data) {
        throw new Error('No data received');
      }

      return {
        totalDonations: parseInt(response.data.totalDonations) || 0,
        ngoCount: parseInt(response.data.ngoCount) || 0,
        volunteerCount: parseInt(response.data.volunteerCount) || 0,
        userCount: parseInt(response.data.userCount) || 0,
        requestCount: parseInt(response.data.requestCount) || 0
      };
    } catch (error) {
      console.error('Error fetching stats:', error.response?.data || error);
      throw error;
    }
  }
}

// Create and export a single instance
const donationService = new DonationService();
export default donationService; 