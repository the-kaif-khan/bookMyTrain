const mongoose = require('mongoose');

const queryhousesSchema = mongoose.Schema({
  ownerPic: Buffer,
  contractPic: Buffer,
  ownername: String,
  email: String,
  franchisepassword: String,
  ownerContact: Number,
  queryhouseContact: Number,
  ownerAddress: String,
  queryhouseAddress: String,
  queryhouseCity: String,
  queryhouseTehsil: String,
  ownerContactForOtp: Number,
  slug: String,
  money: {
    type: Number,
    default: 0
  },
  moneyGiven: {
    type: Number,
    default: 0
  },
  rent: {
    type: Boolean,
    default: false
  },
  remainingMoney: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date, default: Date.now
  },
  banned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  }
})

module.exports = mongoose.model('queryhouses', queryhousesSchema);