const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const notificationSchema = mongoose.Schema({
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: []
    }
  ],
  relatedTo: String,
  notificationText: String,
  success: {
    type: Boolean,
    default: false
  },
  date: {type: Date, default: Date.now},
  read: {type: Boolean, default: false}
}, {timestamps: true});


module.exports = mongoose.model('user-notifications', notificationSchema);