var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');

// Get Users model
var User = require('../models/user');

// Get Auth
var auth = require('../config/auth');

/*
 * GET register
 */
router.get('/register',  (req, res) =>  {

    res.render('register', {
        title: 'Register'
    });

});

/*
 * POST register
 */
router.post('/register',  (req, res) =>  {

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    req.checkBody('name', 'Name is required!').notEmpty();
    req.checkBody('email', 'Email is required!').isEmail();
    req.checkBody('username', 'Username is required!').notEmpty();
    req.checkBody('password', 'Password is required!').notEmpty();
    req.checkBody('password2', 'Passwords do not match!').equals(password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors,
            user: null,
            title: 'Register'
        });
    } else {
        User.findOne({username: username},  (err, user) =>  {
            if (err)
                console.log(err);

            if (user) {
                req.flash('danger', 'Username exists, choose another!');
                res.redirect('/users/register');
            } else {
                var user = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    admin: 0
                });

                bcrypt.genSalt(10,  (err, salt) => {
                    bcrypt.hash(user.password, salt,  (err, hash) => {
                        if (err)
                            console.log(err);

                        user.password = hash;

                        user.save( (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                req.flash('success', 'You are now registered!');
                                res.redirect('/users/login')
                            }
                        });
                    });
                });
            }
        });
    }

});

router.get('/login', auth.isLoggedIn,  (req, res) =>  {

    if (res.locals.user) res.redirect('/');
    
    res.render('login', {
        title: 'Log in'
    });

});

router.post('/login', auth.isLoggedIn,  (req, res, next) => {

    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
    
});


router.get('/logout',  (req, res) =>  {

    req.logout();
    
    req.flash('success', 'You are logged out!');
    res.redirect('/users/login');

});

// Exports
module.exports = router;


