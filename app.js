// Import all packages needed from node_modules
const express           = require('express'),
      bodyParser        = require('body-parser'),
      mongoose          = require('mongoose'),
      path              = require('path'),
      session           = require('express-session'),
      expressValidator  = require('express-validator'),
      fileUpload        = require('express-fileupload'),
      passport          = require('passport'),
      paypal_config     = require('./config/paypal'),
      paypal            = require('paypal-rest-sdk');
    
paypal.configure({
  'mode': 'sandbox',
  'client_id': paypal_config.client_id,
  'client_secret': paypal_config.client_secret 
});
 

const app = express();

const auth = require('./config/auth');

// Setup Database
const myDb = require('./config/database');
mongoose.connect(myDb.databaseProd, { useNewUrlParser: true });
mongoose.connection
  .on('error', console.error.bind(console, 'Connection error: '))
  .once('open', () => console.log('Connected to MongoDB'))

// Setup Middlewares and other settings
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(fileUpload());

app.use(session({
  secret: auth.secret,
  resave: true,
  saveUninitialized: true
//  cookie: { secure: true }
}));

// Set global variable errors to null
app.locals.errors = null;

// Get page Model
const Page = require('./models/pages');
// Get all the pages to add in the header
Page.find({}).sort({sorting: 1}).exec((err, pages) => {
  if(err)
    throw(err)
  else 
    app.locals.pages = pages;
});


// Get category Model
const Category = require('./models/category');
// Get all the pages to add in the header
Category.find({}, (err, categories) => {
  if(err)
    throw(err)
  else 
    app.locals.categories = categories;
});


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

app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
});
 

// Call all routes
const pagesRoutes           = require('./routes/pages'),
      adminPagesRoutes      = require('./routes/admin_pages'),
      adminCategoriesRoutes = require('./routes/admin_categories'),
      adminProducts         = require('./routes/admin_products'),
      admin                 = require('./routes/admin'),
      productsRoutes        = require('./routes/products'),
      usersRoutes           = require('./routes/users'),
      salesRoutes           = require('./routes/admin_sales'),
      cartRoutes            = require('./routes/cart');


app.use('/admin/pages', adminPagesRoutes);
app.use('/admin/categories', adminCategoriesRoutes);
app.use('/admin/products', adminProducts);
app.use('/admin/sales', salesRoutes);
app.use('/admin', admin);
app.use('/products', productsRoutes);
app.use('/cart', cartRoutes);
app.use('/users', usersRoutes);
app.use('/', pagesRoutes);
app.get('*', (req, res) => {
  res.status(404).send('Page not found');
})

var server_host = process.env.OPENSHIFT_NODEJS_IP || process.env.YOUR_HOST || '0.0.0.0';

// Choose Port
const port =  process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 2000 ;

// Start Server
app.listen(port, server_host,() => {
  console.log(`Server started on ${server_host} ${port}`);
});