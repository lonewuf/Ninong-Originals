const mongoose = require('mongoose');

var saleSchema = mongoose.Schema({
  product: [],
  date: {
    type: Date,
    default: Date.now()
  },
  total: Number
});


module.exports = mongoose.model('Sale', saleSchema);