const router = require('express').Router();
const fs = require('fs-extra');

// Product Model
const Product = require('../models/products');
// Category Model
const Category = require('../models/category');


// Get all products
router.get('/', (req, res) => {

  Product.find({}, (err, foundProducts) => {
    if(err) throw(err);
    res.render('all_products', {
      title: 'All Products',
      products: foundProducts
    })
    
  });
});

// Get all products on a category
router.get('/:category', (req, res) => {

  var categorySlug = req.params.category;

  Category.findOne({slug: categorySlug}, (err, foundCategory) => {
    if(err)
      throw(err);   
    Product.find({category: categorySlug}, (err, foundProducts) => {
      if(err) 
        throw(err);
      res.render('category_products', {
        title: foundCategory.title,
        products: foundProducts
      });      
    });
  })

});

// Get all product details
router.get('/:category/:product', (req, res) => {

  var galleryImages = null;
  console.log(req.params)

  Product.findOne({slug: req.params.product}, (err, foundProduct) => {
    if(err)
      throw(err)
    
    console.log(foundProduct)
    
    var galleryDir = `public/product_images/${foundProduct._id}/gallery`;

    fs.readdir(galleryDir, (err, files) => {
      if(err)
        throw(err)
      
      Product.find({})
        .then(foundProducts => {
          res.render('product', {
            title: foundProduct.title,
            product: foundProduct,
            galleryImages: galleryImages,
            products: foundProducts
          });
        })
        .catch(err => console.log(err))
      galleryImages = files;
    });

  });
});


module.exports = router;