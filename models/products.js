const mongoose = require('mongoose');
 
var productSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: String,
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: String,
  quantity: {
    type: Number,
    required: true
  },
  rating: {
    type: Number
  },
  times_sold: {
    type: Number
  },
  times_viewed: {
    type: Number
  },
  color: []
});

module.exports = mongoose.model('Product', productSchema);