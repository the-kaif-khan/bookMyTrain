const mongoose = require('mongoose');

const sellingFormSchema = mongoose.Schema({
  sellerPrice: Number,
  compressedKhatauniFile: {
    type: {
      data: Buffer,
      contentType: String,
      filename: String
    },
    required: true
  },
  khatauniSpecDetails: String,
  contactNumber: Number,
  city: String,
  address: String,
  skymanProductId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'skymanProduct',
      default: []
    }
  ],
  product: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel',
      default: []
    }
  ],
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: []
    }
  ],
  date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('sellingform', sellingFormSchema);