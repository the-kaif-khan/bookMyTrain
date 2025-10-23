const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const queryhouseMoneySchema = mongoose.Schema({
  bayana: Buffer,
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
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
  queryhouse: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'queryhouses',
      default: []
    }
  ],
  queryhouseStaff: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'queryhouse-staffs',
      default: []
    }
  ],
  money: {
    type: Number,
    default: 0
  },
  landbookMoney: {
    type: Number,
    default: 0
  },
  queryhouseMoney: {
    type: Number,
    default: 0
  },
  renting: {
    type: Boolean,
    default: false
  },
  city: String,
  tehsil: String,
});


module.exports = mongoose.model('queryhouseMoney', queryhouseMoneySchema);