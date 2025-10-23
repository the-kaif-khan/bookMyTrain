const mongoose = require('mongoose');

const buyingFormSchema = mongoose.Schema({
  name: String,
  contactNumber: Number,
  tehsil: String,
  address: String,
  product: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel',
      default: []
    }
  ],
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: []
    }
  ],
  date: {type: Date, default: Date.now}
}, {timestamps: true});

module.exports = mongoose.model('buyingform', buyingFormSchema);