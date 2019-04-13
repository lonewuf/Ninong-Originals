const router = require('express').Router();
const paypal = require('paypal-rest-sdk');
const auth = require('../config/auth')
const paypal_config = require('../config/paypal');

// Page Model
const Products = require('../models/products');
const Sales = require('../models/sales');

// Get add product to cart
router.get('/add/:product', (req, res) => {

  var productSlug = req.params.product;

  Products.findOne({slug: productSlug}, (err, foundProduct) => {
    if(err) throw(err);


    if(foundProduct.quantity == 0){
      console.log('Error')
    }else if(typeof req.session.cart === "undefined") {
      req.session.cart = [];
      req.session.cart.push({
        title: productSlug,
        qty: 1,
        price: parseFloat(foundProduct.price).toFixed(2),
        image: `/product_images/${foundProduct._id}/${foundProduct.image}`,
        category: foundProduct.category,
        slug: foundProduct.slug
      });
    } else {
      var cart = req.session.cart;
      var newItem = true;

      for (let i = 0; i < cart.length; i++) {
        if(cart[i].title == productSlug ) {
          cart[i].qty++;
          newItem= false;
          if(foundProduct.quantity < cart[i].qty) {
            cart[i].qty--;
          }
          break;
        } 
      }

      if(newItem) {
        cart.push({
          title: productSlug,
          qty: 1,
          price: parseFloat(foundProduct.price).toFixed(2),
          image: `/product_images/${foundProduct._id}/${foundProduct.image}`,
          category: foundProduct.category,
        slug: foundProduct.slug
        });
      }
    }

    if(foundProduct.quantity){
      req.flash('success', 'Product Added');
    } else {
      req.flash('danger', 'Sorry out of stock');
    }
    res.redirect('back');
  });
});


// Get checkout page 
router.get('/checkout', (req, res) => {

  if(req.session.cart && req.session.cart.length == 0) {
    delete req.session.cart;
    res.redirect('/cart/checkout');
  } else {
    res.render('checkout', {
      title: 'Checkout',
      cart: req.session.cart
    });
  }

});

// Update product
router.get('/update/:product', (req, res) => {

  var slug = req.params.product;
  var cart = req.session.cart;
  var action = req.query.action;

  

  Products.findOne({slug: slug}, (err, foundProduct) => {
  for(let i = 0; i < cart.length; i++) {
      if(cart[i].title == slug) {
        switch(action) {
          case "add":
            cart[i].qty++;

            if(foundProduct.quantity < cart[i].qty) {
              cart[i].qty = foundProduct.quantity;
            }
            break;
          case "remove":
            cart[i].qty--;
            if(cart[i].qty < 1)
              cart.splice(i, 1);
            break;
          case "clear":
            cart.splice(i, 1);
            if(cart.length == 0)
              delete req.session.cart;
            break;
          default:
            console.log('Update problem')
            break;
        }
        break;
      }
    }
    req.flash('success', 'Cart Updated');
    res.redirect('/cart/checkout');
    
  })

});


// Clear cart 
router.get('/clear', (req, res) => {

  delete req.session.cart;

  req.flash('success', 'Cart Cleard');
  res.redirect('/cart/checkout');
  
});

// Testing without paypal
router.post('/testhere', (req, res) => {
  var cart = req.session.cart;
        var purchases = []
        var total = 0;
        cart.forEach(prod => {
          total += parseFloat(prod.price).toFixed(2) * parseInt(prod.qty);
          purchases.push(prod);
        })

        var myPromises = [];

        // Updating Invetory
        cart.forEach((prod) => {
          console.log(prod.title, prod.qty)
          Products.findOne({slug: prod.slug})
            .then(prod1 => {
              Products.updateOne({_id: prod1._id}, {$inc: {quantity: -(parseInt(prod.qty))}})
                .then((product) => console.log(product))
                .catch(err => console.log(err))    
            })
            .catch(err => console.log(err))
          })


          // db.products.updateOne({title:'nova 4'}, {$inc: {quantity: 3}})
        // console.log(myPromises, '+++++')

        // myPromises.forEach(myPromise => 
        // {
        // myPromise
        //   .then((product) => console.log(product, '====='))
        //   .catch((err) => console.log(err))
        // });

        var sales = new Sales({
          product: purchases,
          total: total,
          buyer: req.user.username
        })

        sales.save(err => {
          if(err)
            throw(err)
          else {
            delete req.session.cart;
            req.flash('success', 'Successfully bought item(s)');
            res.redirect('/cart/checkout')

          }
        })
});


router.post('/pay', auth.isUser, (req, res) => {


  var cart = req.session.cart;
  var total = 0;
  var myPurchases = [];
  var p = 0
  
  cart.forEach(product => {
    p = +(parseFloat(product.price).toFixed(2) * product.qty)
    total += p;
    myPurchases.push({
      "name": product.title,
                "price": product.price,
                "currency": "PHP",
                "quantity": product.qty
    })
    p = 0;
  })

  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": paypal_config.success_url,
        "cancel_url": paypal_config.cancel_url
    },
    "transactions": [{
        "item_list": {
            "items": myPurchases
        },
        "amount": {
            "currency": "PHP",
            "total": total
        },
        "description": "Hat for the best team ever"
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
  }
});

});

router.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  var cart = req.session.cart;
  var total = 0;
  var myPurchases = [];
  var p = 0
  
  cart.forEach(product => {
    p = +(parseFloat(product.price).toFixed(2) * product.qty)
    total += p;
    myPurchases.push({
      "name": product.title,
                "price": product.price,
                "currency": "PHP",
                "quantity": product.qty
    })
    p = 0;
  })

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "PHP",
            "total": total
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        // console.log(JSON.stringify(payment));
        var cart = req.session.cart;
        var purchases = []
        var total = 0;
        cart.forEach(prod => {
          total += parseFloat(prod.price).toFixed(2) * parseInt(prod.qty);
          purchases.push(prod);
        })

        var myPromises = [];

        // Updating Invetory
        cart.forEach((prod) => {
          console.log(prod.title, prod.qty)
          Products.findOne({slug: prod.slug})
            .then(prod1 => {
              Products.updateOne({_id: prod1._id}, {$inc: {quantity: -(parseInt(prod.qty))}})
                .then((product) => console.log(product))
                .catch(err => console.log(err))    
            })
            .catch(err => console.log(err))
          })


          // db.products.updateOne({title:'nova 4'}, {$inc: {quantity: 3}})
        // console.log(myPromises, '+++++')

        // myPromises.forEach(myPromise => 
        // {
        // myPromise
        //   .then((product) => console.log(product, '====='))
        //   .catch((err) => console.log(err))
        // });

        var sales = new Sales({
          product: purchases,
          total: total,
          buyer: req.user.username
        })

        sales.save(err => {
          if(err)
            throw(err)
          else {
            delete req.session.cart;
            req.flash('success', 'Successfully bought item(s)');
            res.redirect('/cart/checkout')

          }
        })
    }
});
});

router.get('/cancel', (req, res) => {
  req.flash('danger', 'Transaction is cancelles');
  res.redirect('/cart/checkout');
});

module.exports = router;