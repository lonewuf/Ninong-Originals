// Import all packages needed from node_modules
const express           = require('express'),
      bodyParser        = require('body-parser'),
      mongoose          = require('mongoose'),
      path              = require('path'),
      session           = require('express-session'),
      expressValidator  = require('express-validator'),
      fileUpload        = require('express-fileupload'),
      passport          = require('passport'),
      paypal            = require('paypal-rest-sdk');
    
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AQKFyQ5slFTCzJK4ptOlf-KApv1K4eczFM5ILeifN9FXLs8amP-k9uTj9Msj9LgTUwPbDMFTnhuDw3ZM',
  'client_secret': 'EFLnIV3aRBUu3clfkoeQZK3YwaJ3EsZwTZGfTCXXtN9yoer42rptHtt7onnDDTilB4bq6NL9qlH59fvZ'
});

const app               = express();

// Setup Database
const myDb = require('./config/database');
mongoose.connect(myDb.database);
mongoose.connection
  .on('error', console.error.bind(console, 'Connection error: '))
  .once('open', () => console.log('Connected to MongoDB'))

// Setup Middlewares and other settings
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(fileUpload());

app.use(session({
  secret: 'keyboard cat',
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
})


// Call Routes
const pagesRoutes           = require('./routes/pages'),
      adminPagesRoutes      = require('./routes/admin_pages'),
      adminCategoriesRoutes = require('./routes/admin_categories'),
      adminProducts         = require('./routes/admin_products'),
      productsRoutes        = require('./routes/products'),
      usersRoutes           = require('./routes/users'),
      salesRoutes           = require('./routes/admin_sales'),
      cartRoutes            = require('./routes/cart');

app.use('/admin/pages', adminPagesRoutes);
app.use('/admin/categories', adminCategoriesRoutes);
app.use('/admin/products', adminProducts);
app.use('/admin/sales', salesRoutes);
app.use('/products', productsRoutes);
app.use('/cart', cartRoutes);
app.use('/users', usersRoutes);
app.use('/', pagesRoutes);




// Choose Port
const port = 2000 || process.env.PORT;

// Start Server
app.listen(port, () => {
  console.log(`Server started on ${port}`);
});