const mongoose = require('mongoose');

const mapLabelSchema = mongoose.Schema({
  lat: Number,
  lng: Number,
  labelText: String
});

module.exports = mongoose.model('mapLabel', mapLabelSchema);