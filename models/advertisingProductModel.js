const mongoose = require('mongoose');

const advertisingProductSchema = new mongoose.Schema({
  productNumber: {
    type: Number,
    unique: true
  },
  adOwnerName: String,
  adOwnerContact: Number,
  adOwnerEmail: String,
  contractPic: {
    path: String,
    originalName: String
  },
  productAllImages: [
    {
      path: String,
      originalName: String
    }
  ],
  productVideoFile: {
    path: String,
    originalName: String
  },
  productTitle: String,
  productFullDetails: String,
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('advertisingProduct', advertisingProductSchema);