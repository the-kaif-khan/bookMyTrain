const mongoose = require('mongoose');

const skymanProductSchema = new mongoose.Schema({
  realImage: {
    path: String,
    originalName: String
  },
  mainRoadImages: [
    {
      path: String,
      originalName: String
    }
  ],
  image360: {
    path: String,
    originalName: String
  },
  khatauniFile: {
    path: String,
    originalName: String
  },
  videoFile: {
    path: String,
    originalName: String
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  productFolderName: {
    type: Number,
    unique: true
  },
  landAddress: String,
  contactNumber: Number,
  tehsil: String,
  badnaamSpec: String,
  lat: Number,
  lng: Number,
  sellerPrice: Number,
  LB: String,
  spec: [String],
  khatauniSpecDetails: String,
  sellerId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  sellingFormId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'sellingform',
      default: []
    }
  ],
  productId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel'
    }
  ],
  skymanName: String // Optional, to track
});

module.exports = mongoose.model('skymanProduct', skymanProductSchema);