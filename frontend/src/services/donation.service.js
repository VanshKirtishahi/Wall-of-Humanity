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
      const response = await api.put(`/donations/${id}`, formData, {
        headers: {
          ...(!(formData instanceof FormData) && {
            'Content-Type': 'application/json'
          })
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Update donation error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        throw new Error('Authentication required');
      }
      throw new Error(error.response?.data?.message || 'Failed to update donation');
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
      // Create a new FormData instance
      const form = new FormData();
      
      // Handle form data
      for (const [key, value] of Object.entries(formData)) {
        if (key === 'images') {
          if (value instanceof File) {
            form.append('images', value);
          }
        } else if (key === 'availability' || key === 'location') {
          // Only append if value exists
          if (value) {
            const jsonValue = typeof value === 'object' ? JSON.stringify(value) : value;
            form.append(key, jsonValue);
          }
        } else {
          // Only append if value is not null/undefined
          if (value != null) {
            form.append(key, value);
          }
        }
      }

      const response = await api.post('/donations', form);
      return response.data;
    } catch (error) {
      console.error('Create donation error:', error);
      throw error;
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