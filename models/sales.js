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
  Paid: String,
  buyerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  delivered: {
    type: Boolean,
    default: false
  }
});


module.exports = mongoose.model('Sale', saleSchema);