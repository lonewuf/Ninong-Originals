const router = require('express').Router();

// Page Model
const Page = require('../models/pages');



router.get('/', (req, res) => {

  Page.findOne({slug: 'home'}, (err, foundPage) => {
    if(err) throw(err);

    
    res.render('index', {
      title: foundPage.title,
      content: foundPage.content
    })
    
  });
});


router.get('/:slug', (req, res) => {
  
  var slug = req.params.slug;

  Page.findOne({slug: slug}, (err, foundPage) => {
    if(err) throw(err);

    if(!foundPage) {
      res.redirect('/');
    } else {
      res.render('index', {
        title: foundPage.title,
        content: foundPage.content
      })
    }
  });
});

module.exports = router;