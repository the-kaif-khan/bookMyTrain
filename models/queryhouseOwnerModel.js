const mongoose = require('mongoose');

const queryhouseOwnerSchema = mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  contactNumber: Number,
  address: String,
  tehsil: String,
  city: String,
  ownerContactForOtp: Number,
  banned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  }
})

module.exports = mongoose.model('queryhouse-owner', queryhouseOwnerSchema);