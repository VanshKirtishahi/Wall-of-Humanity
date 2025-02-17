import api from './api';

const getAllNGOs = async () => {
  try {
    const response = await api.get('/ngos');
    return response.data;
  } catch (error) {
    console.error('Error fetching NGOs:', error);
    throw error.response?.data || { message: 'Error fetching NGOs' };
  }
};

const registerNGO = async (ngoData) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user.token;

    if (!token) {
      window.location.href = '/login';
      throw new Error('Please login to register your NGO');
    }

    const formData = new FormData();
    
    // Handle text fields
    const textFields = [
      'organizationName',
      'organizationEmail',
      'phoneNumber',
      'contactPersonName',
      'contactPersonEmail',
      'contactPersonPhone',
      'ngoType',
      'address',
      'ngoWebsite',
      'socialMediaLinks'
    ];

    textFields.forEach(field => {
      if (ngoData[field]) {
        formData.append(field, ngoData[field]);
      }
    });

    // Handle files specifically
    if (ngoData.logo instanceof File) {
      formData.append('logo', ngoData.logo, ngoData.logo.name);
    }
    if (ngoData.certification instanceof File) {
      formData.append('certification', ngoData.certification, ngoData.certification.name);
    }

    // Handle date
    if (ngoData.incorporationDate) {
      formData.append('incorporationDate', ngoData.incorporationDate.toISOString());
    }

    const response = await api.post('/ngos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('NGO Registration Error:', error.response?.data);
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    throw error.response?.data || { message: 'Failed to register NGO' };
  }
};

const updateNGOStatus = async (ngoId, status) => {
  try {
    const response = await api.patch(`/ngos/${ngoId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating NGO status:', error);
    throw error.response?.data || { message: 'Error updating NGO status' };
  }
};

const getNGOProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get('/ngos/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching NGO profile:', error);
    throw error.response?.data || { message: 'Error fetching NGO profile' };
  }
};

export default { getAllNGOs, registerNGO, updateNGOStatus, getNGOProfile }; 