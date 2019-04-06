const mongoose = require('mongoose');

var categorySchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: String,
  
});

module.exports = mongoose.model('Category', categorySchema);