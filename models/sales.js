const mongoose = require('mongoose');

var saleSchema = mongoose.Schema({
  product: [],
  date: {
    type: Date,
    default: Date.now()
  },
  total: Number,
  buyer: {
    type: String,
    required: true
  }, 
  buyerName: {
    type: String
  },
  phone_number: {
    type: String
  },
  paid: {
    type: Boolean,
    default: false
  },
  buyerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  address: {
    type: String
  },
  invoiceSaved: {
    type: Boolean,
    default: false
  },
  shipping_fee: {
    type: Number,
    default: 100
  },
  totalWithShipping: Number
});


module.exports = mongoose.model('Sale', saleSchema);