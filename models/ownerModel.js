const mongoose = require('mongoose');

const ownerSchema = mongoose.Schema({
  fullname: String,
  username: String,
  email: String,
  password: String,
  contact: Number,
  gstin: String,
})

module.exports = mongoose.model('owner', ownerSchema);