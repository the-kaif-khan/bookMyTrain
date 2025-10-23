const mongoose = require('mongoose');

const cityTehsilSchema = mongoose.Schema({
  city: String,
  tehsils: [String]
})

module.exports = mongoose.model('cityTehsilModel', cityTehsilSchema);