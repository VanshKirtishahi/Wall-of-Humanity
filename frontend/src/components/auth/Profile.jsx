import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { format, isValid } from 'date-fns';
import { FiEdit2, FiSave, FiX, FiCamera, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: '',
    email: '',
    bio: '',
    phone: '',
    address: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState(null);

  const defaultAvatar = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  `);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true); // Set loading at start
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data);
        if (data.avatarUrl) {
          setAvatarPreview(`http://localhost:5000${data.avatarUrl}`);
        }
        setEditedData({
          name: data.name || '',
          email: data.email || '',
          bio: data.bio || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        setError(error.message);
      } finally {
        setLoading(false); // Set loading to false regardless of success/failure
      }
    };

    fetchProfileData();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      name: profileData.name || '',
      email: profileData.email || '',
      bio: profileData.bio || '',
      phone: profileData.phone || '',
      address: profileData.address || ''
    });
    setAvatarPreview(profileData.avatarUrl);
    setAvatar(null);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setAvatar(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editedData.name);
      formData.append('email', editedData.email);
      if (avatar) {
        formData.append('avatar', avatar);
      }

      const response = await api.put('/auth/profile/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedData = response.data;
      
      // Update context and local storage with new user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...currentUser, 
        ...updatedData,
        token: currentUser.token // Preserve the token
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setProfileData(updatedData);
      if (updatedData.avatarUrl) {
        setAvatarPreview(`${import.meta.env.VITE_API_URL}${updatedData.avatarUrl}`);
      }
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    try {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/auth/profile/delete');
        localStorage.clear();
        logout();
        toast.success('Account deleted successfully');
        navigate('/login');
      } catch (error) {
        console.error('Delete account error:', error);
        toast.error(error.response?.data?.message || 'Failed to delete account');
        
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid date';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-gray-600">No profile data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-purple-600 to-purple-400"></div>

          {/* Profile Header */}
          <div className="relative px-6">
            <div className="flex items-center">
              {/* Avatar */}
              <div className="-mt-16 relative">
                <div className="relative">
                  <img
                    src={avatarPreview || (profileData?.avatarUrl ? `http://localhost:5000${profileData.avatarUrl}` : defaultAvatar)}
                    alt="Profile"
                    className="h-32 w-32 rounded-full border-4 border-white object-cover bg-white shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultAvatar;
                    }}
                  />
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 bg-purple-500 rounded-full p-2 cursor-pointer hover:bg-purple-600 transition-colors">
                      <FiCamera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Name and Email */}
              <div className="ml-6 pt-2">
                <div className="text-2xl font-bold text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.name}
                      onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                      className="border-b-2 border-purple-500 focus:outline-none px-1 py-0.5"
                      placeholder="Your name"
                    />
                  ) : (
                    profileData.name
                  )}
                </div>
                <div className="flex items-center mt-1 text-gray-600">
                  <FiMail className="w-4 h-4 mr-2" />
                  {profileData.email}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-6 space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <FiX className="w-4 h-4 mr-1.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <FiSave className="w-4 h-4 mr-1.5" />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <FiEdit2 className="w-4 h-4 mr-1.5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-6">
            {/* Bio Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">About</h3>
              {isEditing ? (
                <textarea
                  value={editedData.bio}
                  onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {profileData.bio || 'No bio added yet'}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center text-gray-700 mb-4">
                  <FiPhone className="w-5 h-5 mr-3 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedData.phone}
                      onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                      className="flex-1 border-b border-gray-300 focus:border-purple-500 focus:outline-none px-1 py-0.5"
                      placeholder="Your phone number"
                    />
                  ) : (
                    <span>{profileData.phone || 'No phone number added'}</span>
                  )}
                </div>
                <div className="flex items-center text-gray-700">
                  <FiMapPin className="w-5 h-5 mr-3 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.address}
                      onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                      className="flex-1 border-b border-gray-300 focus:border-purple-500 focus:outline-none px-1 py-0.5"
                      placeholder="Your address"
                    />
                  ) : (
                    <span>{profileData.address || 'No address added'}</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center text-gray-700 mb-4">
                  <FiCalendar className="w-5 h-5 mr-3 text-gray-400" />
                  <span>Joined {formatDate(profileData.createdAt)}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <FiCalendar className="w-5 h-5 mr-3 text-gray-400" />
                  <span>Last updated {formatDate(profileData.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <button
              onClick={handleDeleteAccount}
              className="text-red-600 hover:text-red-700 text-sm font-medium focus:outline-none"
            >
              Delete Account
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 