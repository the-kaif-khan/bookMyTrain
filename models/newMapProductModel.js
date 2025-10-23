const mongoose = require('mongoose');

const newMapProductSchema = mongoose.Schema({
  clusterName: String,
  lat: Number,
  lng: Number,
  popupText: String,
  productId: String,
  city: String,
  tehsil: String,
  price: Number,
  spec: [String],
  LB: String
})

module.exports = mongoose.model('newMapProduct', newMapProductSchema);