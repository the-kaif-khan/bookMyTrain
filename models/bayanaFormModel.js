const mongoose = require('mongoose');

const bayanaFormSchema = mongoose.Schema({
  bayanaImage: Buffer,
  contactNumber: Number,
  address: String,
  date: {type: Date, default: Date.now},
  userId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  productId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'productModel'
    }
  ]
});

module.exports = mongoose.model('bayanaFormModel', bayanaFormSchema);