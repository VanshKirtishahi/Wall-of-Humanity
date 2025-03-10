import api from '../config/axios';

class FreeFoodService {
  async getAllListings() {
    try {
      const response = await api.get('/api/free-food');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch free food listings');
    }
  }

  async getListing(id) {
    try {
      const response = await api.get(`/api/free-food/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch listing');
    }
  }

  async createListing(formData) {
    try {
      const response = await api.post('/api/free-food', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create listing');
    }
  }

  async updateListing(id, formData) {
    try {
      const response = await api.put(`/api/free-food/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update listing');
    }
  }

  async deleteListing(id) {
    try {
      const response = await api.delete(`/api/free-food/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete listing');
    }
  }
}

export default new FreeFoodService(); 