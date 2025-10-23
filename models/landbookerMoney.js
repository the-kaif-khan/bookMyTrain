const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const landbookerMoneySchema = mongoose.Schema({
  bayana: Buffer,
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: []
    }
  ],
  landbooker: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'landbookers',
      default: []
    }
  ],
  productId : [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel',
      default: []
    }
  ],
  money: {
    type: Number,
    default: 0
  },
  moneyGiven: {
    type: Number,
    default: 0
  },
  remainingMoney: {
    type: Number,
    default: 0
  },
  city: String,
  tehsil: String,
});


module.exports = mongoose.model('landbookerMoney', landbookerMoneySchema);