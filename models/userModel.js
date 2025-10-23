const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const userSchema = mongoose.Schema({
  name: String,
  username: String,
  contactNumber: Number,
  email: String,
  claimCart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel'
    }
  ],
  buyingCart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel'
    }
  ],
  sellingForm: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'sellingform',
      default: []
    }
  ],
  sellingProduct: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel',
      default: []
    }
  ],
  buyingForm: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'buyingform',
      default: []
    }
  ],
  buyingCartTimerId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'buyingCartTimer',
      default: []
    }
  ],
  buyingProduct: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel',
      default: []
    }
  ],
  password: String,
  buyingMessageFromLandbook: [
    {
      message: {type: String, required: true},
      date: {type: Date, default: Date.now},
      read: {type: Boolean, default: false},
      buyingFormDate: {type: Date, default: Date.now}
    }
  ],
  sellingMessageFromLandbook: [
    {
      message: {type: String, required: true},
      date: {type: Date, default: Date.now},
      read: {type: Boolean, default: false},
      sellingFormDate: {type: Date, default: Date.now}
    }
  ],
  claimedMessageFromLandbook: [
    {
      message: {type: String, required: true},
      date: {type: Date, default: Date.now},
      read: {type: Boolean, default: false},
      productId: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'productModel'
        }
      ]
    }
  ],
  bayana: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'bayanaFormModel'
    }
  ],
  notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user-notifications',
      default: []
    }
  ],
  banned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  }
});


module.exports = mongoose.model('user', userSchema);