const router    = require('express').Router(),
      mkdirp    = require('mkdirp'),
      fs        = require('fs-extra'),
      resizeImg = require('resize-img')

// Get Product Model
const Product = require('../models/products');

// Get Category Model
const Category = require('../models/category');

const auth = require('../config/auth')



router.get('/', auth.isAdmin, (req, res) => {
    var count = 0;

    // Product.countDocuments((err, c) => {
    //   count = c;
    // });
    // console.log(count);
    // Product.find({}, (err, products) => {
    //   res.render('admin/products', {
    //     products: products,
    //     count: count
    //   })
    // })

    Product.countDocuments()
      .then(count => {
        Product.find({})
          .then(products => {
            res.render('admin/products', {
              products,
              count
            })
          })
          .catch(err => console.log(err))
      })
      .catch(err => console.log(err))

});


router.get('/add-product', auth.isAdmin, (req, res) => {
  var title = '';
  var description = '';
  var price = '';
  var quantity = '';

  Category.find({}, (err, foundCategories) => {
    res.render('admin/add_product', {
      title: title,
      description: description,
      categories: foundCategories,
      price: price,
      quantity: quantity
    });
  })
  
});

// Post Product
router.post('/add-product', auth.isAdmin, (req, res) => {

  var imageF = typeof req.files.image !== "undefined" ? req.files.image.name : "";

  req.checkBody('title', 'Title must have a value').notEmpty();
  req.checkBody('description', 'Description must have a value').notEmpty();
  req.checkBody('price', 'Price must have a value').notEmpty();
  req.checkBody('quantity', 'Quantity must have a value').notEmpty();
  req.checkBody('image', 'You muse upload an image').isImage(imageF);
  
  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var description = req.body.description;
  var price = req.body.price;
  var quantity = req.body.quantity;
  var category = req.body.category;
  
  // Regex for checking price if numeric
  var checkNum = /[^0-9.]/;
  var checkQuantity = /[^0-9]/;

  if(checkNum.test(price) || price == '.') {
    req.flash('danger', 'Price must be numberic');
    Category.find({}, (err, foundCategories) => {
      res.render('admin/add_product', {
        errors: errors,
        title: title,
        description: description,
        categories: foundCategories,
        price: "",
        quantity: quantity
      });
    });
  } else if(checkQuantity.test(quantity)) {
    req.flash('danger', 'Quantity must be numberic');
    Category.find({}, (err, foundCategories) => {
      res.render('admin/add_product', {
        errors: errors,
        title: title,
        description: description,
        categories: foundCategories,
        price: price,
        quantity: ""
      });
    });
  }

  var errors = req.validationErrors();

  if(errors) {
    Category.find({}, (err, foundCategories) => {
      res.render('admin/add_product', {
        errors: errors,
        title: title,
        description: description,
        categories: foundCategories,
        price: price,
        quantity: quantity
      });
    })
  } else {
    Product.findOne({slug: slug}, (err, foundSlug) => {
      if(foundSlug) {
        req.flash('danger', 'Product title is already exist, choose another one');
        Category.find({}, (err, foundCategories) => {
          res.render('admin/add_product', {
            title: title,
            description: description,
            categories: foundCategories,
            price: price,
            quantity: quantity
          });
        });
      } else if (err) {
        throw (err);
      } else {
        
        var formatPrice = parseFloat(price).toFixed(2);
        var product = new Product({
          title: title,
          slug: slug,
          description: description,
          categories: category,
          price: formatPrice,
          category: category,
          quantity: quantity,
          image: imageF
        });

        console.log(product)

        product.save(err => {
          if(err)
            throw(err);
          else {

            mkdirp(`public/product_images/${product._id}`, err => {
              if(err)
                throw (err);
            });

            mkdirp(`public/product_images/${product._id}/gallery`, err => {
              if(err)
                throw (err);
            });

            mkdirp(`public/product_images/${product._id}/gallery/thumbs`, err => {
              if(err)
                throw (err);
            });

            if(imageF != "") {
              var productImage = req.files.image;
              var path = `public/product_images/${product._id}/${imageF}`

              productImage.mv(path, err => {
                console.log(err);
              });
            }

            req.flash('success', 'Product added');
            res.redirect('/admin/products');
          }
        });
      }
    })
  }
});

// Edit product
router.get('/edit-product/:id', auth.isAdmin, (req, res) => {
  
  var errors;

  if(req.session.errors)
    errors = req.session.errors
  req.session.errors = null;

  Category.find({}, (err, foundCategories) => {

    Product.findById(req.params.id, (err, foundProduct) => {
      if(err) {
        console.log(err);
         res.redirect('/admin/products');
      } else {
        var galleryDir = `public/product_images/${foundProduct._id}/gallery`;
        var galleryImages = null;

        fs.readdir(galleryDir, (err, files) => {
          if(err)
            throw(err)
          else {
            galleryImages = files;

            res.render('admin/edit_product', {
              title: foundProduct.title,
              description: foundProduct.description,
              categories: foundCategories,
              price: parseFloat(foundProduct.price).toFixed(2),
              category: foundProduct.category.replace(/\s+/g, '-').toLowerCase(),
              errors: errors,
              quantity: foundProduct.quantity,
              image: foundProduct.image,
              galleryImages: galleryImages,
              id: foundProduct._id
            });
          }

          }
        );
      }
    })
  })

});

// Edit Product
router.post('/edit-product/:id', auth.isAdmin, (req, res) => {

  var imageF = typeof req.files.image !== "undefined" ? req.files.image.name : "";

  req.checkBody('title', 'Title must have a value').notEmpty();
  req.checkBody('description', 'Description must have a value').notEmpty();
  req.checkBody('price', 'Price must have a value').notEmpty();
  req.checkBody('image', 'You muse upload an image').isImage(imageF);

  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var description = req.body.description;
  var price = req.body.price;
  var category = req.body.category;
  var quantity = !!req.body.quantityAdd ? req.body.quantityAdd : req.body.quantityRemove;

  var quantityBool = !!req.body.quantityAdd ? true : false;
  var pimage = req.body.pimage;
  var id = req.params.id
  console.log(req.body.quantityAdd, req.body.quantityRemove)
  console.log(!!req.body.quantityAdd)
  
  // Regex for checking price if numeric
  var checkNum = /[^0-9.]/;
  var checkQuantity = /[^0-9]/;

  if(checkNum.test(price) || price == '.') {
    req.flash('danger', 'Price must be numberic');
    Category.find({}, (err, foundCategories) => {
      res.render('admin/add_product', {
        errors: errors,
        title: title,
        description: description,
        categories: foundCategories,
        price: "",
        quantity: quantity
      });
    })
  } else if(checkQuantity.test(parseInt(quantity))) {
    req.flash('Quantity', 'Quantity must be numberic');
    Category.find({}, (err, foundCategories) => {
      res.render('admin/add_product', {
        errors: errors,
        title: title,
        description: description,
        categories: foundCategories,
        price: price,
        quantity: ""
      });
    })
  }

  var errors = req.validationErrors();

  if(errors) {
    req.session.errors = errors;
    res.redirect('/admin/products/edit-product/' + id);
  } else {
    Product.findOne({slug: slug, _id:{'$ne': id}}, (err, foundProduct) => {
      if (err)
        throw (err);

      if (foundProduct) {
        req.flash('danger', 'Product title exists, choose another one');
        res.redirect('/admin/products/edit-product/' + id);
        
      } else {
        Product.findById(id, (err, foundProductById) => {
          if (err)
            throw (err);

          console.log(foundProductById, quantity)

          foundProductById.title = title;
          foundProductById.slug = slug;
          foundProductById.price = parseFloat(price).toFixed(2);
          foundProductById.description = description;
          foundProductById.category = category;
          foundProductById.quantity = quantityBool ? parseInt(foundProductById.quantity) + parseInt(quantity) :  parseInt(foundProductById.quantity) - parseInt(quantity);
          if(imageF != "") {
            foundProductById.image = imageF;
          }

          foundProductById.save(err => {
            if(err)
              throw(err)

            if(imageF != "") {
              if(pimage != "") {
                fs.remove(`public/product_images/${id}/${pimage}`, err => {
                  if(err)
                    throw(err);
                })
              }

              var productImage = req.files.image;
              var path = `public/product_images/${ id}/${imageF}`

              productImage.mv(path, err => {
                console.log(err);
              });

            }
            req.flash('success', 'Product modified');
            res.redirect(`/admin/products/edit-product/${id}`);
          })

        })
      }
    })
  }

});

// Post product gallery
router.post('/product-gallery/:id', auth.isAdmin, (req, res) => {

  var productImage = req.files.file;
  var id = req.params.id;
  var path = `public/product_images/${id}/gallery/${req.files.file.name}`;
  var thumbsPath = `public/product_images/${id}/gallery/thumbs/${req.files.file.name}`;

  productImage.mv(path, err => {
    if(err)
      console.log(err);

    resizeImg(fs.readFileSync(path), {width: 100, height: 100})
      .then(buf => {
        fs.writeFileSync(thumbsPath, buf)
      });
  });

  res.sendStatus(200);

});

// Delete Image
router.get('/delete-image/:image', function (req, res) {

  var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
  var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

  fs.remove(originalImage, function (err) {
      if (err) {
          console.log(err);
      } else {
          fs.remove(thumbImage, function (err) {
              if (err) {
                  console.log(err);
              } else {
                  req.flash('success', 'Image deleted!');
                  res.redirect('/admin/products/edit-product/' + req.query.id);
              }
          });
      }
  });
});


router.get('/delete-product/:id', auth.isAdmin, (req, res) => {

  var id = req.params.id;
  var path = `public/product_images/${id}`;

  fs.remove(path, err => {
    if(err) {
      console.log(err);
    } else {
      Product.findByIdAndRemove(id, err => {
        if(err)
          throw(err);
        else {
          req.flash('success', 'Product deleted!');
          res.redirect('/admin/products/');
        }
      })
    }
  })
  
});

module.exports = router;