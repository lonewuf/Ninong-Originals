const router = require('express').Router();
const paypal = require('paypal-rest-sdk');
const https   = require("https");
const fs      = require("fs");
const auth = require('../config/auth')
const paypal_config = require('../config/paypal');


// Page Model
const Products = require('../models/products');
const Sales = require('../models/sales');

// Get add product to cart
router.get('/add/:product', (req, res) => {

  var productSlug = req.params.product;
  console.log(req.params.product)

  Products.findOne({slug: productSlug}, (err, foundProduct) => {
    if(err) throw(err);
    console.log(foundProduct)

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


// Get add product to cart
router.get('/add-by-id/:id', (req, res) => {

  var productID = req.params.id;

  Products.findOne({_id: productID}, (err, foundProduct) => {
    if(err) throw(err);
    
    const productSlug = foundProduct.slug

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

// Get payment method page
router.get('/payment-method', (req, res) => {

  res.render('payment-method', {
    title: 'Payment Method',
    cart: req.session.cart
  })
}); 

router.get('/confirm-payment', auth.isUser, (req, res) => {
  var paymentMethod = req.query.selectPayment;
  if(paymentMethod == 'paypal' || paymentMethod == 'cod')
  {
    console.log(paymentMethod + "----")
    res.render('confirm-payment', {
      title: 'Confirm Payment',
      cart: req.session.cart,
      paymentMethod: paymentMethod
    });
  } else {
    console.log(paymentMethod + "----")
    req.flash('danger', 'Please choose payment method');
    res.redirect('/cart/payment-method');
  } 
});

// Update product
router.get('/update/:product', (req, res) => {

  var slug = req.params.product;
  var cart = req.session.cart;
  var action = req.query.action;

  console.log(action)
  

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

// COD
router.post('/cod', auth.isUser, (req,res) => {

  if(!req.session.cart) {
    req.flash('danger', 'Your cart is empty')
    res.redirect('/');
  }

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
  });

  // =======generating invoice
  function generateInvoice(invoice, filename, success, error) {
    var postData = JSON.stringify(invoice);
    var options = {
        hostname  : "invoice-generator.com",
        port      : 443,
        path      : "/",
        method    : "POST",
        headers   : {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData)
        }
    };
  
    var file = fs.createWriteStream(filename);
  
    var req = https.request(options, function(res) {
        res.on('data', function(chunk) {
            file.write(chunk);
        })
        .on('end', function() {
            file.end();
  
            if (typeof success === 'function') {
                success();
            }
        });
    });
    req.write(postData);
    req.end();
  
    if (typeof error === 'function') {
        req.on('error', error);
    }
  }
  //=====

  // var sales = new Sales({
  //   product: purchases,
  //   total: total,
  //   buyer: req.user.username,
  //   buyerName: req.user.name,
  //   phone_number: "phone number",
  //   address: "Dummy address",
  //   paid: false
  // });

  // sales.save(err => {
  //   if(err)
  //     throw(err)
  //   else {
  //     delete req.session.cart;
  //     req.flash('success', 'Successfully bought item(s)');
  //     res.redirect('/cart/checkout');
  //   }
  // });

  var sales = {
    product: purchases,
    total: total,
    buyer: req.user.username,
    buyerName: req.user.name,
    phone_number: req.user.phone_number,
    address: req.user.address,
    totalWithShipping: (total + 100),
    paid: false
  };



  Sales.create(sales, (err, createdSale) => {
    if(err) {
      throw(err)
    } else {
      console.log(createdSale)
      var invoice = {}

      var invoicePaymentTerms = createdSale.paid ? "Paypal - Paid" : "COD - Unpaid"
      var invoiceItems = []

      createdSale.product.forEach(product => {
        invoiceItems.push({
          name: product.title,
          quantity: product.qty,
          unit_cost: parseFloat(product.price).toFixed(2)
        })
      })

      invoice = {
        logo: "http://invoiced.com/img/logo-invoice.png",
        from: "Invoiced\n701 Brazos St\nAustin, TX 78748",
        to: createdSale.buyerName,
        currency: "php",
        number: createdSale._id,
        shipping: parseFloat(100).toFixed(2),
        amount_paid: 0,
        payment_terms: invoicePaymentTerms,
        items: invoiceItems,
        // fields: {
        //     tax: "%"
        // },
        // tax: 5,
        notes: `Thanks for availing our product Sir/Maam ${createdSale.buyerName}`,
        terms: null
      };
    
      generateInvoice(invoice, __dirname + `/files/invoice-${createdSale._id}.pdf`, () => {
        console.log(`Saved invoice`);
        delete req.session.cart;
        req.flash('success', 'Successfully bought item(s)');
        res.redirect('/cart/checkout');
      }, function(error) {
          console.error(error);
      });

      
    }
  })



});

// Paypal
router.post('/pay', auth.isUser, (req, res) => {

  var cart = req.session.cart;

  if(!req.session.cart) {
    req.flash('danger', 'Your cart is empty')
    res.redirect('/');
  }

  var total = 0;
  var myPurchases = [];
  var p = 0
  var shippingFee = 100;

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
            "total": (total + shippingFee),
            "details": {
              "subtotal" : total,
              "shipping": shippingFee
            }
        },
        "description": ""
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

  function generateInvoice(invoice, filename, success, error) {
    var postData = JSON.stringify(invoice);
    var options = {
        hostname  : "invoice-generator.com",
        port      : 443,
        path      : "/",
        method    : "POST",
        headers   : {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData)
        }
    };
  
    var file = fs.createWriteStream(filename);
  
    var req = https.request(options, function(res) {
        res.on('data', function(chunk) {
            file.write(chunk);
        })
        .on('end', function() {
            file.end();
  
            if (typeof success === 'function') {
                success();
            }
        });
    });
    req.write(postData);
    req.end();
  
    if (typeof error === 'function') {
        req.on('error', error);
    }
  }

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
        });

        var sales ={
          product: purchases,
          total: total,
          buyer: req.user.username,
          buyerName: req.user.name,
          phone_number: req.user.phone_number,
          address: req.user.address,
          city: req.user.city,
          totalWithShipping: (total + 100),
          paid: true
        };
      
        Sales.create(sales, (err, createdSale) => {
          if(err) {
            throw(err)
          } else {
            console.log(createdSale)
            var invoice = {}
      
            var invoicePaymentTerms = createdSale.paid ? "Paypal - Paid" : "COD - Unpaid"
            var invoiceItems = []
      
            createdSale.product.forEach(product => {
              invoiceItems.push({
                name: product.title,
                quantity: product.qty,
                unit_cost: parseFloat(product.price).toFixed(2)
              })
            }) 
      
            invoice = {
              logo: null,
              from: `Invoiced\n${req.user.address}\n${req.user.city}`,
              to: createdSale.buyerName,
              currency: "php",
              number: createdSale._id,
              payment_terms: invoicePaymentTerms,
              items: invoiceItems,
              shipping: parseFloat(100).toFixed(2),  
              amount_paid: createdSale.totalWithShipping,
              balance: 0,
              notes: `Thank you for buying in our store Sir/Maam ${createdSale.buyerName}.`,
              terms: null
              // fields: {
              //     tax: "%"
              // },
              // tax: 5,
              
            };
          
            generateInvoice(invoice, __dirname + `/files/invoice-${createdSale._id}.pdf`, () => {
              console.log(`Saved invoice`);
              delete req.session.cart;
              req.flash('success', 'Successfully bought item(s)');
              res.redirect('/cart/checkout');
            }, function(error) {
                console.error(error);
            });
      
            
          }
        })

    }
  });
});

router.get('/cancel', (req, res) => {
  req.flash('danger', 'Transaction is cancelled');
  res.redirect('/cart/checkout');
});

module.exports = router;