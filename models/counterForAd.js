const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const counterSchemaForAd = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('counterForAdsModel', counterSchemaForAd);