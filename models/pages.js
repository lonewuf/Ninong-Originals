const mongoose = require('mongoose');

var pageSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: String,
  content: {
    type: String,
    required: true
  },
  sorting: Number
  
});

module.exports = mongoose.model('Page', pageSchema);