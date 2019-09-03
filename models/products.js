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
    num_rated: {
      type: Number,
      default: 0
    },
    total_rating: {
      type: Number,
      default: 0
    }
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