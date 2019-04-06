const router = require('express').Router();

// Get Category Model
const Category = require('../models/category');
const auth = require('../config/auth')


// Display all Categories
router.get('/', auth.isAdmin, (req, res) => {
  Category.find({}, (err, allCategories) => {
    res.render('admin/categories', {
      categories: allCategories
    })
  })
});

// Add category
router.get('/add-category', auth.isAdmin, (req, res) => {
  var title = '';
  res.render('admin/add_category', {
    title: title
  });
});

router.post('/add-category', auth.isAdmin, (req, res) => {

  req.checkBody('title', 'Title must have a value').notEmpty();  
  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();

  var errors = req.validationErrors();

  if(errors) {
    res.render('admin/add_category', {
      errors: errors,
      title: title,
    })
  } else {
    Category.findOne({slug: slug}, (err, foundSlug) => {
      if(foundSlug) {
        req.flash('danger', 'Category title is already exist, choose another one');
        res.render('admin/add_page', {
          title: title,
        });
      } else if (err) {
        throw (err);
      } else {
        var category = new Category({
          title: title,
          slug: slug
        });

        category.save(err => {
          if(err)
            throw (err);
          else {

            Category.find({}, (err, categories) => {
              if(err)
                throw(err)
              else 
                req.app.locals.categories = categories;
            });

            req.flash('success', 'Category added');
            res.redirect('/admin/categories');
          }
        });
      }
    })
  }
});


router.get('/edit-category/:id', auth.isAdmin, (req, res) => {
  
  Category.findById(req.params.id, (err, foundCategory) => {
    if(err) 
      throw(err)
    else {
      res.render('admin/edit_category', {
        title: foundCategory.title,
        id: foundCategory._id
      });
    }
  })

});

// Modify Category
router.post('/edit-category/:id', auth.isAdmin, (req, res) => {

  req.checkBody('title', 'Title must have a value').notEmpty();
  
  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var id = req.params.id;
  

  var errors = req.validationErrors();

  if(errors) {
    res.render('admin/edit_category', {
      errors: errors,
      title: title,
      id: id
    })
  } else {
    Category.findOne({slug: slug, _id:{'$ne': id}}, (err, foundCategory) => {
      if(foundCategory) {
        req.flash('danger', 'Category title is already exist, choose another one');
        res.render('admin/edit_category', {
          title: title,
          id: id
        });
      } else {

        Category.findById(id, (err, foundCategory) => {
          if(err) 
            throw (err);
          else {
            foundCategory.title = title;
            foundCategory.slug = slug;
        
            foundCategory.save(err => {
              if(err)
                throw (err);
              else {

                Category.find({}, (err, categories) => {
                  if(err)
                    throw(err)
                  else 
                    req.app.locals.categories = categories;
                });

                req.flash('success', 'Category Modified');
                res.redirect(`/admin/categories/edit-category/${id}`);
              }
            });
          }
        })
      }
    })
  }
});

router.get('/delete-category/:id', auth.isAdmin, (req, res) => {
  Category.findByIdAndRemove(req.params.id, err => {
    if (err) 
      throw (err);
    else {

      Category.find({}, (err, categories) => {
        if(err)
          throw(err)
        else 
          req.app.locals.categories = categories;
      });

      req.flash('success', 'Category Deleted');
      res.redirect(`/admin/categories`);
    }
  })
});

module.exports = router;