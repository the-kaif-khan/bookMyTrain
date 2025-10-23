const mongoose = require('mongoose');

const buyingCartTimerSchema = mongoose.Schema({
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

module.exports = mongoose.model('buyingCartTimer', buyingCartTimerSchema);