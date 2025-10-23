const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const counterSchema = mongoose.Schema({
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

module.exports = mongoose.model('counterModel', counterSchema);