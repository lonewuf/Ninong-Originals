const router = require('express').Router();
const https   = require("https");
const fs      = require("fs");
// Get Page Model
const Sales = require('../models/sales');

const auth = require('../config/auth')


router.get('/', auth.isAdmin, (req, res) => {

  if(req.query.dateFrom && req.query.dateTo){

    var from = req.query.dateFrom
    var to = req.query.dateTo
    var checkDate = false
    if(from < to){

      Sales.find({"date" : {"$gte": new Date(`${from}`), "$lt" : new Date(`${to}`) }, "paid":true }, (err, foundSales) => {
        if(err)
          throw(err);
        console.log(foundSales)
        checkDate = true
        res.render('admin/all_sales', {
          sales: foundSales,
          from,
          to,
          checkDate
        })
      })
    }
    else {
      req.flash('danger', 'Choose valid date')
      res.redirect('/admin/sales')
    }
  } else {

    Sales.find({}).sort({'date': -1}).exec((err, foundSales) => {
      if(err)
        throw(err);
      res.render('admin/all_sales', {
        sales: foundSales,
        checkDate
      })
    })
  }
});

router.get('/sales-report', auth.isAdmin, (req, res) => {

  if(req.query.dateFrom != null && req.query.dateFrom != null){

    var from = req.query.dateFrom
    var to = req.query.dateTo
    var checkDate = false

    
    if(from < to){

      Sales.find({"date" : {"$gte": new Date(`${from}`), "$lt" : new Date(`${to}`) }, "paid":true }, (err, foundSales) => {
        if(err)
          throw(err);
    
        var total = 0
        checkDate = true
        
        foundSales.forEach(sale => {
          // temp = parseFloat(sale.total).toFixed(2)
          if(sale.paid) 
            total += parseFloat(sale.total.toFixed(2))
        })
    
        total = total.toFixed(2)
        
        res.render('admin/sales_report', {
          sales: foundSales,
          total,
          from,
          to,
          checkDate
        })
      })
    }
    else {
      req.flash('danger', 'Choose valid date')
      res.redirect('/admin/sales/sales-report')
    }
  } else {

    Sales.find({}, (err, foundSales) => {
      if(err)
        throw(err);
  
      var total = 0
      var temp= 0
      checkDate = false
      foundSales.forEach(sale => {
        // temp = parseFloat(sale.total).toFixed(2)
        if(sale.paid) 
          total += parseFloat(sale.total.toFixed(2))
      })
  
      total = total.toFixed(2)
      
      res.render('admin/sales_report', {
        sales: foundSales,
        total,
        checkDate
      })
    })
  }
});

router.get('/:id', auth.isAdmin, (req, res) => {

  var id = req.params.id;
  Sales.findById(id, (err, foundSales) => {
    if(err)
      throw(err);
    res.render('admin/sale', {
      sales: foundSales,
      arrSales: foundSales.product
    })
  })
 
});

router.get('/:id/show-invoice', auth.isAdmin, (req, res) => {

var id = req.params.id

  Sales.findById(id)
    .then(foundSale => {
      var filePath = `/files/invoice-${foundSale._id}.pdf`;
      fs.readFile(__dirname + filePath , function (err,data){
          res.contentType("application/pdf");
          res.send(data);
      });
    })
    .catch(err => console.log(err))
})

router.post('/:id/delivered', auth.isAdmin, (req, res) => {

  var id = req.params.id;

  Sales.updateOne({_id: id}, {$set: {"isDelivered": true}})
    .then(updatedProduct => {
      
      req.flash('success', 'Successfully updated transaction to "Delivered"');
      res.redirect(`/admin/sales/${id}`)
    })
    .catch(err => console.log(err))

});

router.post('/:id/paid', auth.isAdmin, (req, res) => {

  var id = req.params.id;

  Sales.updateOne({_id: id}, {$set: {"paid": true}})
    .then(updatedProduct => {
      
      req.flash('success', 'Successfully updated transaction to "Paid"');
      res.redirect(`/admin/sales/${id}`)
    })
    .catch(err => console.log(err))

});


module.exports = router;