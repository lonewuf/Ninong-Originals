const router = require('express').Router();

// Get Page Model
const Page = require('../models/pages');
const auth = require('../config/auth')


router.get('/', auth.isAdmin, (req, res) => {
   res.redirect('/admin/categories');
});

module.exports = router;