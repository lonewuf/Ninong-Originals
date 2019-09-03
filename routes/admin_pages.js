const router = require('express').Router();

// Get Page Model
const Page = require('../models/pages');
const auth = require('../config/auth')


router.get('/', auth.allAdmin, (req, res) => {
  Page.find({}).sort({sorting: 1}).exec((err, pages) => {
    if(err) throw(err);
    else {
      res.render('admin/pages', {
        pages: pages
      })
    }
  });
});


router.get('/add-page', auth.isAdmin, (req, res) => {
  var title = '';
  var slug = '';
  var content = '';

  res.render('admin/add_page', {
    title: title,
    slug: slug,
    content: content
  });
});

router.post('/add-page', auth.isAdmin, (req, res) => {

  req.checkBody('title', 'Title must have a value').notEmpty();
  req.checkBody('content', 'Content must have a value').notEmpty();
  
  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if(slug === "") 
    slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;
 
  var errors = req.validationErrors();

  if(errors) {
    res.render('admin/add_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content
    })
  } else {
    Page.findOne({slug: slug}, (err, foundSlug) => {
      if(foundSlug) {
        req.flash('danger', 'Page slug is already exist, choose another one');
        res.render('admin/add_page', {
          title: title,
          slug: slug,
          content: content
        });
      } else if (err) {
        throw (err);
      } else {
        var page = new Page({
          title: title,
          slug: slug,
          content: content,
          sorting: 100
        });

        page.save(err => {
          if(err)
            throw(err);
          else {

            Page.find({}).sort({sorting: 1}).exec((err, pages) => {
              if(err)
                throw(err)
              else 
                req.app.locals.pages = pages;
            });

            req.flash('success', 'Page added');
            res.redirect('/admin/pages');
          }
        });
      }
    })
  }
});

//Sort the pages

function sortPages(pagesToSort, callback) {

  var count = 0;

  for (let i = 0; i < pagesToSort.length; i++) {
    var id = pagesToSort[i];
    count++;

    (count => {
      Page.findById(id, (err, foundPage) => {
        foundPage.sorting = count;
        foundPage .save(err => {
          if (err) throw (err);
          ++count;
          if(count >= pagesToSort.length) {
            callback();
          }
        });
      });
    })(count);
  }
}


// Reordering page
router.post('/reorder-pages', auth.isAdmin, (req, res) => {
  
  var pagesToSort = req.body.id
  console.log(pagesToSort)
  sortPages(pagesToSort, () => {
    Page.find({}).sort({sorting: 1}).exec((err, pages) => {
      if(err)
        throw(err)
      else 
        req.app.locals.pages = pages;
    });  
  })
  
  
});


router.get('/edit-page/:id', auth.isAdmin, (req, res) => {
  
  Page.findById(req.params.id, (err, foundPage) => {
    if(err) 
      throw(err)
    else {
      console.log(foundPage)
      res.render('admin/edit_page', {
        title: foundPage.title,
        slug: foundPage.slug,
        content: foundPage.content,
        id: foundPage._id
      });
    }
  })
  

});


router.post('/edit-page/:id', auth.isAdmin, (req, res) => {

  req.checkBody('title', 'Title must have a value').notEmpty();
  req.checkBody('content', 'Content must have a value').notEmpty();
  
  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if(slug === "") 
    slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;
  var id = req.params.id;
  

  var errors = req.validationErrors();

  if(errors) {
    res.render('admin/edit_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content,
      id: id
    })
  } else {
    Page.findOne({slug: slug, _id:{'$ne': id}}, (err, foundPage) => {
      if(foundPage) {
        req.flash('danger', 'Page slug is already exist, choose another one');
        res.render('admin/edit_page', {
          title: title,
          slug: slug,
          content: content,
          id: id
        });
      } else {

        Page.findById(id, (err, foundPage) => {
          if(err) 
            throw (err);
          else {
            foundPage.title = title;
            foundPage.slug = slug;
            foundPage.content = content;
        
            foundPage.save(err => {
              if(err)
                throw (err);
              else {

                Page.find({}).sort({sorting: 1}).exec((err, pages) => {
                  if(err)
                    throw(err)
                  else 
                    req.app.locals.pages = pages;
                });

                req.flash('success', 'Page Modified');
                res.redirect(`/admin/pages/edit-page/${id}`);
              }
            });
          }
        })
      }
    })
  }
});

router.get('/delete-page/:id', auth.isAdmin, (req, res) => {

  Page.findById(req.params.id, (err, foundPage) => {
    if(err)
      throw (err);
    else if (foundPage.slug == 'home') {
      req.flash('danger', 'You can\'t delete home page');
      res.redirect('/admin/pages');
    } else {
      Page.findByIdAndRemove(req.params.id, err => {
        if (err) throw (err);
        else {

          Page.find({}).sort({sorting: 1}).exec((err, pages) => {
            if(err)
              throw(err)
            else 
              req.app.locals.pages = pages;
          });

          req.flash('success', 'Page Deleted');
          res.redirect(`/admin/pages`);
        }
      })
    }
  });
});

module.exports = router;