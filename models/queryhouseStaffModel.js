const mongoose = require('mongoose');

const queryhouseStaffSchema = mongoose.Schema({
  fullname: String,
  username: String,
  email: String,
  password: String,
  contactNumber: Number,
  address: String,
  tehsil: String,
  city: String,
  owner: String,
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

module.exports = mongoose.model('queryhouse-staffs', queryhouseStaffSchema);