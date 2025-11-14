const mongoose = require('mongoose');

const cityProductSchema = mongoose.Schema({
  city: {
    type: String,
    required: true
  },
  tehsils: [{type: String}],
  visits: {
    type: Number,
    default: 0
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel',
      default: []
    }
  ]
})

module.exports = mongoose.model('cityProductModel', cityProductSchema);