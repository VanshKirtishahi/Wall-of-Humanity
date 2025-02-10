import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../config/axios';

const FreeFoodForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const foodTypes = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
    'Beverages',
    'Full Meals',
    'Prasad',
    'Langar',
    'Other'
  ];

  const [formData, setFormData] = useState({
    venue: '',
    foodType: '',
    availability: {
      startTime: '',
      endTime: '',
      specificDate: new Date().toISOString().split('T')[0]
    },
    organizedBy: '',
    uploadedBy: user?._id || '',
    venueImage: null,
    location: {
      address: '',
      coordinates: {
        lat: null,
        lng: null
      }
    }
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData || !JSON.parse(userData).token) {
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/free-food/${id}`);
      const listing = response.data;
      
      if (!listing) {
        toast.error('Listing not found');
        navigate('/free-food');
        return;
      }

      // Format the date to YYYY-MM-DD
      const formattedDate = listing.availability?.specificDate 
        ? new Date(listing.availability.specificDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      setFormData({
        venue: listing.venue || '',
        foodType: listing.foodType || '',
        availability: {
          startTime: listing.availability?.startTime || '',
          endTime: listing.availability?.endTime || '',
          specificDate: formattedDate
        },
        organizedBy: listing.organizedBy || '',
        uploadedBy: listing.uploadedBy || user?._id || '',
        venueImage: null,
        location: {
          address: listing.location?.street 
            ? `${listing.location.street}, ${listing.location.city}, ${listing.location.state} ${listing.location.zipCode}`
            : listing.location?.address || '',
          coordinates: {
            lat: listing.location?.latitude || null,
            lng: listing.location?.longitude || null
          }
        }
      });

      // Set image preview if exists
      if (listing.venueImage) {
        setImagePreview(`${api.defaults.baseURL}/uploads/free-food/${listing.venueImage}`);
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to fetch listing details');
      navigate('/free-food');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else if (name.includes('availability.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, venueImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formDataToSend = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (key === 'venueImage') {
        if (formData[key]) {
          formDataToSend.append('venueImage', formData[key]);
        }
      } else if (key === 'availability' || key === 'location') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      let response;
      if (id) {
        response = await api.put(`/api/free-food/${id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Free food listing updated successfully!');
      } else {
        response = await api.post('/api/free-food', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Free food listing created successfully!');
      }

      // Update image preview if new image was uploaded
      if (response.data.venueImage) {
        setImagePreview(`${api.defaults.baseURL}/uploads/free-food/${response.data.venueImage}`);
      }

      navigate('/free-food', { 
        state: { 
          listingSuccess: true, 
          message: id ? 'Listing updated successfully!' : 'Listing created successfully!' 
        }
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(id ? 'Failed to update listing' : 'Failed to create listing');
    } finally {
      setIsLoading(false);
    }
  };

  // Update submit button text based on whether editing or creating
  const submitButtonText = id ? 'Update Free Food Listing' : 'Create Free Food Listing';

  return (
    <div className="min-h-screen bg-gray-50 py-12 mt-16">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-purple-100">
        <h2 className="text-3xl font-bold text-purple-900 mb-8 text-center">Create Free Food Listing</h2>
        
        <div className="space-y-8">
          {/* Venue Information */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-purple-900 mb-4">Venue Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-700">Venue Name</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
                  required
                  placeholder="Enter venue name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700">Food Type</label>
                <select
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
                  required
                >
                  <option value="">Select Food Type</option>
                  {foodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700">Organized By</label>
                <input
                  type="text"
                  name="organizedBy"
                  value={formData.organizedBy}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
                  required
                  placeholder="Enter organizer name"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-purple-900 mb-4">Location Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700">Address</label>
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
                  required
                  placeholder="Enter complete address"
                />
              </div>
            </div>
          </div>

          {/* Availability Section */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-purple-900 mb-4">Availability</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-700">Availability Type</label>
                <select
                  name="availability.type"
                  value={formData.availability.type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
                >
                  <option value="specific">Specific Date</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekend">Weekend (Sat-Sun)</option>
                  <option value="allDays">All Days</option>
                </select>
              </div>

              {formData.availability.type === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    name="availability.specificDate"
                    value={formData.availability.specificDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
                    required={formData.availability.type === 'specific'}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-700">Start Time</label>
                  <input
                    type="time"
                    name="availability.startTime"
                    value={formData.availability.startTime}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700">End Time</label>
                  <input
                    type="time"
                    name="availability.endTime"
                    value={formData.availability.endTime}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-purple-900 mb-4">Venue Image</h3>
            <div className="space-y-4">
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-50 file:text-purple-700
                  hover:file:bg-purple-100"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-48 w-auto object-cover rounded-lg" />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition duration-150 ease-in-out shadow-md"
            >
              {isLoading ? 'Processing...' : submitButtonText}
            </button>
            <button
              type="button"
              onClick={() => navigate('/free-food')}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition duration-150 ease-in-out shadow-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FreeFoodForm; 