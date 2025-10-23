const mongoose = require('mongoose');

const mapProductSchema = mongoose.Schema({
  title: String,
  productImages: [Buffer],
  latitude: Number,
  longitude: Number,
  productId: String,
  city: String,
  tehsil: String
})

module.exports = mongoose.model('mapProduct', mapProductSchema);