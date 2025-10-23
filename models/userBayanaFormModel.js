const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const userBayanaSchema = mongoose.Schema({
  currentContact: Number,
  email: String,
  bayana: Buffer,
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: []
    }
  ],
  productSeller: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: []
    }
  ],
  buyingFormId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'buyingform'
    }
  ],
  buyingCartTimerId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'buyingCartTimer'
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
  priority: {
    type: Number,
    unique: true
  },
  city: String,
  tehsil: String,
});


module.exports = mongoose.model('userBayanaForm', userBayanaSchema);