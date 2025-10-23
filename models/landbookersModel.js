const mongoose = require('mongoose');

const landbookersSchema = mongoose.Schema({
  fullname: String,
  username: String,
  email: String,
  password: String,
  contactNumber: Number,
  address: String,
  ownerContactForOtp: Number,
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
  banned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  }
})

module.exports = mongoose.model('landbookers', landbookersSchema);