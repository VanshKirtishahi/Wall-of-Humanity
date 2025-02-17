const mongoose = require('mongoose');

const freeFoodSchema = new mongoose.Schema({
  type: String,
  venue: String,
  foodType: String,
  availability: {
    type: {
      type: String,
      enum: ['specific', 'weekdays', 'weekend', 'allDays']
    },
    specificDate: String,
    startTime: String,
    startPeriod: {
      type: String,
      enum: ['AM', 'PM'],
      default: 'AM'
    },
    endTime: String,
    endPeriod: {
      type: String,
      enum: ['AM', 'PM'],
      default: 'PM'
    }
  },
  organizedBy: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  venueImage: {
    type: String,
    required: false
  },
  location: {
    address: String,
    area: String,
    city: String,
    state: String
  }
}, { timestamps: true });

freeFoodSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('FreeFoodListing', freeFoodSchema);