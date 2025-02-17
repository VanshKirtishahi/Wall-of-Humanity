import api from '../config/axios';

const volunteerService = {
  register: async (volunteerData) => {
    try {
      const response = await api.post('/volunteers', volunteerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register volunteer' };
    }
  }
};

export default volunteerService;