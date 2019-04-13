var express           = require('express');
var path              = require('path');
var mongoose          = require('mongoose');
var db_config         = require('./config/database');
var paypal_config     = require('./config/paypal');
var bodyParser        = require('body-parser');
var session           = require('express-session');
var expressValidator  = require('express-validator');
var fileUpload        = require('express-fileupload');
var passport          = require('passport');
var paypal            = require('paypal-rest-sdk');
    
paypal.configure({
  'mode': 'sandbox',
  'client_id': paypal_config.client_id,
  'client_secret': paypal_config.client_secret 
});

const app = express();


// Call Routes
var pRoutes = require('./routes/pages');
var adminPRoutes = require('./routes/admin_pages');
var adminCRoutes = require('./routes/admin_categories');
var adminProdRoutes = require('./routes/admin_products');
var prodRoutes = require('./routes/products');
var uRoutes = require('./routes/users');
var sRoutes = require('./routes/admin_sales');
var cRoutes = require('./routes/cart');


// Configure and setup Database
mongoose.connect(db_config.database, { useNewUrlParser: true });
var myDb = mongoose.connection;
myDb.on('error', console.error.bind(console, 'Connection error: '));
myDb.once('open', () => console.log('Connected to MongoDB'))
/////

// Configure middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
/////

app.locals.errors = null;

// Get pages and categories to initialize its contents
var MyPages = require('./models/pages');
MyPages.find({}).sort({sorting: 1}).exec((err, pages) => {
  if(err)
    throw(err)
  else 
    app.locals.pages = pages;
});
var MyCategories = require('./models/category');
MyCategories.find({}, (err, categories) => {
  if(err)
    throw(err)
  else 
    app.locals.categories = categories;
});
/////


// Middleware for error checking in posting data 
app.use(expressValidator({
  errorFormatter: function (param, msg, value) {
      var namespace = param.split('.')
              , root = namespace.shift()
              , formParam = root;

      while (namespace.length) {
          formParam += '[' + namespace.shift() + ']';
      }
      return {
          param: formParam,
          msg: msg,
          value: value
      };
  },
  customValidators: {
    isImage: function (value, filename) {
        var extension = (path.extname(filename)).toLowerCase();
        switch (extension) {
            case '.jpg':
                return '.jpg';
            case '.jpeg':
                return '.jpeg';
            case '.png':
                return '.png';
            case '':
                return '.jpg';
            default:
                return false;
        }
    }
  }
}));
/////


// Middleware for displaying message in pages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});
/////


// Configuring passport and setting up middleware
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
////

// Set cart and user to be global variable
app.use((req, res, next) => {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
})
/////



// Set Routes 
app.use('/admin/pages', adminPRoutes);
app.use('/admin/categories', adminCRoutes);
app.use('/admin/products', adminProdRoutes);
app.use('/admin/sales', sRoutes);
app.use('/products', prodRoutes);
app.use('/cart', cRoutes);
app.use('/users', uRoutes);
app.use('/', pRoutes);

// Choose host for deployment and development
var server_host = process.env.YOUR_HOST || '0.0.0.0';

// Choose Port for deployment and development
const port = 2000 || process.env.PORT;

// Start Server
app.listen(port, server_host,() => console.log(`Server started on ${port}`));