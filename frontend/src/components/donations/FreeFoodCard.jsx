import React from 'react';
import { formatFullAddress } from '../../utils/locationUtils';
import { toast } from 'react-toastify';
import { DEFAULT_VENUE_IMAGE } from '../../constants/images';
import { FiClock } from 'react-icons/fi';

const FreeFoodCard = ({ freeFood, isOwner, onEdit, onDelete, showControls = true, isListing = false }) => {
  const handleGetLocation = () => {
    // Get coordinates from the location object
    const { coordinates } = freeFood.location || {};
    
    // Check if we have valid coordinates
    if (coordinates?.lat && coordinates?.lng) {
      // Use coordinates directly for more accurate location
      const mapUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(mapUrl, '_blank');
    } else {
      // Fallback to address-based location
      const address = formatFullAddress(freeFood.location);
      if (address) {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(mapUrl, '_blank');
      } else {
        toast.error('Location information is not available');
      }
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return DEFAULT_VENUE_IMAGE;
    // If it's already a Cloudinary URL, return it as is
    if (imagePath.includes('cloudinary.com')) {
      return imagePath;
    }
    return DEFAULT_VENUE_IMAGE;
  };

  const formatAvailability = () => {
    // Parse availability if it's a string
    let availability = freeFood.availability;
    
    try {
      if (typeof freeFood.availability === 'string') {
        availability = JSON.parse(freeFood.availability);
      }
    } catch (error) {
      console.error('Error parsing availability:', error);
    }

    let availabilityText = '';
    switch (availability?.type) {
      case 'specific':
        const date = availability.specificDate ? new Date(availability.specificDate).toLocaleDateString() : 'Not specified';
        availabilityText = `${date}`;
        break;
      case 'weekdays':
        availabilityText = 'Every Weekday (Mon-Fri)';
        break;
      case 'weekend':
        availabilityText = 'Every Weekend (Sat-Sun)';
        break;
      case 'allDays':
        availabilityText = 'All Days';
        break;
      default:
        availabilityText = 'Schedule not specified';
    }

    return (
      <div className="flex flex-col space-y-3">
        <div className="space-y-1">
          <span className="text-sm font-medium">{availabilityText}</span>
          {availability?.startTime && availability?.endTime && (
            <span className="text-sm block">
              {`${availability.startTime} ${availability.startPeriod} - ${availability.endTime} ${availability.endPeriod}`}
            </span>
          )}
        </div>
        
        {availability?.notes && availability.notes.trim() !== '' && (
          <div className="mt-2 text-sm bg-purple-50 p-3 rounded-lg border border-purple-100">
            <p className="font-bold text-purple-700 mb-1">Additional Notes:</p>
            <p className="text-gray-700 whitespace-pre-wrap">{availability.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const handleImageError = (e) => {
    e.target.src = DEFAULT_VENUE_IMAGE;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Card Image with Gradient Overlay */}
      <div className="relative h-56">
        <img
          src={getImageUrl(freeFood.venueImage)}
          alt={freeFood.venue}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/50" />
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            {freeFood.foodType}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{freeFood.venue}</h3>
        {freeFood.organizedBy && (
          <div className="text-sm text-gray-600 mb-2">
            Organized by: {freeFood.organizedBy}
          </div>
        )}
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatAvailability()}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {formatFullAddress(freeFood.location)}
          </div>
        </div>

        {/* Add notes display */}
        {freeFood.availability?.notes && (
          <div className="px-4 py-2 text-gray-600">
            <p className="font-medium">Notes:</p>
            <p>{freeFood.availability.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4">
          {isListing ? (
            // Show edit and delete buttons only in FreeFoodListings page
            isOwner ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(freeFood._id)}
                  className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(freeFood._id)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            ) : null
          ) : (
            // Show only get location button in FreeFoodCart
            <button
              onClick={handleGetLocation}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Get Location
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeFoodCard; 