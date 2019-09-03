const router = require('express').Router();
const nodemailer = require('nodemailer');

// Models
const Page = require('../models/pages');
const Product = require('../models/products');
const Category = require('../models/products');

const userAuth = require('../config/userauths');


 
router.get('/', (req, res) => {

  Page.findOne({slug: 'home'}, (err, foundPage) => {
    if(err) throw(err);

    Product.find({})
      .then(foundProducts => {
        
        res.render('index', {
          title: foundPage.title,
          content: foundPage.content,
          products: foundProducts
        })
      })
    .catch(err => console.log(err))
  
  });
});

router.get('/about-us', (req, res) => {
  res.render('about_us', {title: 'About us'})
})

router.get('/contact-us', (req, res) => {
  res.render('contact_us', {title: 'Contact us'})
})

router.post('/contact-us', (req, res) => {

  var name = `From ${req.body.firstname} ${req.body.lastname}`
  var email = req.body.email
  var subject = req.body.subject
  var message = req.body.message
  var website = req.body.website

  var transporter = nodemailer.createTransport({
    service: userAuth.tMail,
    auth: {
            user: userAuth.uName,
            pass: userAuth.pW
        }
    });

  const mailOptions = {
      from: userAuth.uName, // sender address
      to: userAuth.uName, // list of receivers
      subject: subject, // Subject line
      html: `<h2>From ${name}</h2>
      <br><br>
      From: ${email? email : 'No email'}
      <br><br>
      Website: ${website ? website : 'No website'}
      <br><br>
      ${message ? message : 'No message'}
      `// plain text body
  };

  transporter.sendMail(mailOptions)
      .then(info => {
          console.log(info)
          req.flash('success', 'Email sent');
          res.redirect('/');
      })
      .catch(err => {
        console.log(err)
          // req.flash('danger', 'Email not sent')
          // res.redirect('/contact-us');
      })
})

// router.get('/:slug', (req, res) => {
  
//   var slug = req.params.slug;

//   Page.findOne({slug: slug}, (err, foundPage) => {
//     if(err) throw(err);

//     if(!foundPage) {
//       res.redirect('/');
//     } else {
//       res.render('index', {
//         title: foundPage.title,
//         content: foundPage.content
//       })
//     }
//   });
// });



module.exports = router;