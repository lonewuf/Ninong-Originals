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
  }
});


module.exports = mongoose.model('Sale', saleSchema);