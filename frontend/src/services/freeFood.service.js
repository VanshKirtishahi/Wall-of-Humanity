import api from '../config/axios';

const freeFoodService = {
  createListing: async (formData) => {
    try {
      const form = new FormData();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;

      if (!token) {
        throw new Error('Please login to create a listing');
      }

      // Handle form data
      Object.keys(formData).forEach(key => {
        if (key === 'venueImage') {
          if (formData.venueImage instanceof File) {
            form.append('venueImage', formData.venueImage);
          }
        } else if (typeof formData[key] === 'object') {
          form.append(key, JSON.stringify(formData[key]));
        } else {
          form.append(key, formData[key]);
        }
      });

      const response = await api.post('/api/free-food', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Create listing error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { message: 'Failed to create listing' };
    }
  },

  updateListing: async (id, formData) => {
    try {
      const form = new FormData();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;

      if (!token) {
        throw new Error('Please login to update the listing');
      }

      // Handle form data
      Object.keys(formData).forEach(key => {
        if (key === 'venueImage') {
          if (formData.venueImage instanceof File) {
            form.append('venueImage', formData.venueImage);
          } else if (formData.venueImage === null) {
            form.append('deleteImage', 'true');
          }
        } else if (typeof formData[key] === 'object') {
          form.append(key, JSON.stringify(formData[key]));
        } else {
          form.append(key, formData[key]);
        }
      });

      const response = await api.put(`/api/free-food/${id}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update listing' };
    }
  }
};

export default freeFoodService; 