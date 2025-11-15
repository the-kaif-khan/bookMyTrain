const mongoose = require('mongoose');

let productSchema = mongoose.Schema({
  productImages: [Buffer],
  badnaamImage: Buffer,
  compressedKhatauniFile: {
    type: {
      data: Buffer,
      contentType: String,
      filename: String
    },
    required: true
  },
  product360Image: {
    type: Buffer,
    required: false
  },
  ratingImage: Buffer,
  ratingCount: Number,
  title: String,
  zameenNumber: {
    type: Number,
    unique: true
  },
  city: String,
  tehsil: String,
  landAddress: String,
  area: Number,
  sellerPrice: Number,
  landbookPrice: Number,
  brokerPrice: Number,
  LB: String,
  spec: [String],
  why: [String],
  lat: Number,
  lng: Number,
  sellingFormId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'sellingform',
      default: []
    }
  ],
  visits: {
      type: Number,
      default: 0
    },
  claimedPeople: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  buyingPeople: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  buyingForm: [
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
  seller: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  sellerContact: Number,
  skymanProductId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'skymanProduct',
      default: []
    }
  ],
  mapMarkerId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'newMapProduct',
      default: []
    }
  ],
  bayana: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userBayanaForm'
    }
  ],
  youtubeLink: {
    type: String,
    required: false
  },
  keys: String,
  recommendation: String
});

module.exports = mongoose.model('productModel', productSchema);