const express = require('express');
const router = express.Router();
const passport = require('passport');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const auth = require('../config/auth'); 
const userAuth = require('../config/userauths');

// Get Models
const User = require('../models/user');
const Sale = require('../models/sales');
const ForgotPassword = require('../models/forgotpassword');

router.get('/register', auth.isLoggedIn, function (req, res) {

    res.render('register', {
        title: 'Register'
    });

});

// Register Customer
router.post('/register', auth.isLoggedIn,function (req, res) {

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var address = req.body.address;
    var phone_number = req.body.phone_num;
    var city = req.body.city;
    var password = req.body.password;
    var password2 = req.body.password2;

    req.checkBody('name', 'Name is required!').notEmpty();
    req.checkBody('city', 'City is required!').notEmpty();
    req.checkBody('phone_num', 'Phone Number is required!').notEmpty();
    req.checkBody('address', 'address is required!').notEmpty();
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
        User.findOne({username: username}, function (err, user) {
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
                    address:address,
                    city: city,
                    phone_number: phone_number,
                    admin: 0
                });

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(user.password, salt, function (err, hash) {
                        if (err)
                            console.log(err);

                        user.password = hash;

                        user.save(function (err) {
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

// Register Customer
router.post('/register-from-billing',function (req, res) {

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var address = req.body.address;
    var phone_number = req.body.phone_num;
    var city = req.body.city;
    var password = req.body.password;
    var password2 = req.body.password2;

    req.checkBody('name', 'Name is required!').notEmpty();
    req.checkBody('city', 'City is required!').notEmpty();
    req.checkBody('phone_num', 'Phone Number is required!').notEmpty();
    req.checkBody('address', 'address is required!').notEmpty();
    req.checkBody('email', 'Email is required!').isEmail();
    req.checkBody('username', 'Username is required!').notEmpty();
    req.checkBody('password', 'Password is required!').notEmpty();
    req.checkBody('password2', 'Passwords do not match!').equals(password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('payment-method', {
            errors: errors,
            user: null,
            cart: req.session.cart,
            title: 'Register'
        }); 
    } else {
        User.findOne({username: username}, function (err, user) {
            if (err)
                console.log(err);

            if (user) {
                req.flash('danger', 'Username exists, choose another!');
                res.redirect('/cart/payment-method');
            } else {
                
                var user = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    address:address,
                    city: city,
                    phone_number: phone_number,
                    admin: 0
                });

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(user.password, salt, function (err, hash) {
                        if (err)
                            console.log(err);

                        user.password = hash;

                        user.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.flash('success', 'You are now registered please login');
                                res.redirect('/cart/payment-method')
                            }
                        });
                    });
                });
            }
        });
    }

});

// Register new admin GET
router.get('/register-admin', auth.isAdmin, function (req, res) {

    res.render('admin/register', {
        title: 'Register new admin'
    });

});

// Register new admin POST
router.post('/register-admin', auth.isAdmin,function (req, res) {

    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var address = req.body.address;
    var phone_number = req.body.phone_num;
    var city = req.body.city;
    var password = req.body.password;
    var password2 = req.body.password2;
    var admin = req.body.admin;


    if(admin == null) {
        req.flash('danger', 'Select type of admin')
        res.redirect('back')
    }

    req.checkBody('name', 'Name is required!').notEmpty();
    req.checkBody('address', 'Address is required!').notEmpty();
    req.checkBody('phone_num', 'Phone Number is required!').notEmpty();
    req.checkBody('city', 'City is required!').notEmpty();
    req.checkBody('email', 'Email is required!').isEmail();
    req.checkBody('username', 'Username is required!').notEmpty();
    req.checkBody('password', 'Password is required!').notEmpty();
    req.checkBody('password2', 'Passwords do not match!').equals(password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('admin/register', {
            errors: errors,
            title: 'Register'
        }); 
    } else {
        User.findOne({username: username}, function (err, user) {
            if (err)
                console.log(err);

            if (user) {
                req.flash('danger', 'Username exists, choose another!');
                res.redirect('back');
            } else {
                var user = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    address: address,
                    phone_number: phone_number,
                    city: city,
                    admin: admin
                });

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(user.password, salt, function (err, hash) {
                        if (err)
                            console.log(err);

                        user.password = hash;

                        user.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.flash('success', 'New admin is now registered');
                                res.redirect('/admin')
                            }
                        });
                    });
                });
            }
        });
    }

});

router.get('/login', auth.isLoggedIn, function (req, res) {

    if (res.locals.user) res.redirect('/');
    
    res.render('login', {
        title: 'Log in'
    });

});

router.post('/login', auth.isLoggedIn, function (req, res, next) {

    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
    
});

router.post('/login-from-billing', auth.isLoggedIn, function (req, res, next) {

    passport.authenticate('local', {
        successRedirect: '/cart/payment-method',
        failureRedirect: '/cart/payment-method',
        failureFlash: true
    })(req, res, next);
    
});

/*
 * GET logout
 */
router.get('/logout', function (req, res) {

    req.logout();
    req.flash('success', 'You are logged out!');
    res.redirect('/users/login');

});



// Get user profile
router.get('/profile/:username', auth.isUser, (req, res) => {
    User.findOne({username: req.params.username})
        .then(foundUser => {

            res.render('user-profile', {
                foundUser,
                title: `${foundUser.name}'s Profile`
            })
        })
        .catch(err => {
            req.flash('danger', 'User is not present')
            res.redirect('/');
        });
});

// Get user product status
router.get('/product-status/:username', auth.isUser, (req, res) => {
    User.findOne({username: req.params.username})
        .then(foundUser => {

            if(foundUser.username != req.user.username) {
                req.flash('danger', 'You can\'t do that action')
                req.redirect('back')
            }

            Sale.find({buyer: foundUser.username})
                .then(sales => {
                    res.render('user-product-status', 
                    {   foundUser, 
                        sales, 
                        title: `${foundUser.name}'s Profile`,
                        currentUser: req.user
                    });
                })
                .catch(err => console.log(err));
        })
        .catch(err => {
            req.flash('danger', 'User is not present')
            res.redirect('/');
        });
});

// Get edit user profile
router.get('/profile/:username/edit', auth.isUser, (req, res) => {
    User.findOne({username: req.params.username})
        .then(foundUser => {
            if(foundUser.username != req.user.username) {
                req.flash('danger', 'You can\'t do that action')
                req.redirect('back')
            }
            res.render('edit-user-profile', {
                foundUser,
                title: `${foundUser.name}'s Profile`
            })
        })
        .catch(err => { 
            req.flash('danger', 'User is not present')
            res.redirect('/');
        });
});

// Post edit user profile
router.post('/profile/:username/edit', auth.isUser, (req, res) => {

    
    var name = req.body.name;
    var email = req.body.email;
    var address = req.body.address;
    var city = req.body.city;
    var phone_number = req.body.phone_num;


    req.checkBody('name', 'Name is required!').notEmpty();
    req.checkBody('city', 'City / Municipality is required!').notEmpty();
    req.checkBody('address', 'Address is required!').notEmpty();
    req.checkBody('email', 'Email is required!').isEmail();
 

    User.findOne({username: req.params.username})
        .then(foundUser => {
            if(foundUser.username != req.user.username) {
                req.flash('danger', 'You can\'t do that action')
                req.redirect('back')
            }

            var errors = req.validationErrors();

            if (errors) {
                res.render('edit-user-profile', {
                    errors: errors,
                    title: `Edit Profile`
                }); 
            } else {

                var updateUser = {
                    name: name,
                    email: email,
                    address:address,
                    city: city,
                    phone_number: phone_number,
                }

                User.updateOne({username: req.params.username}, updateUser)
                    .then(foundUser2 => {
                        req.flash('success', 'Profile Updated')
                        res.redirect(`/users/profile/${req.user.username}`);
                    })
                    .catch(err => console.log(err))

            }


            User.updateOne({username: req.params.username})
                .then(foundUser2 => {
                    
                })
        })
        .catch(err => {
            console.log(err)
        });
});

// Forgot password - GET
router.get('/forgot-password', (req, res) => {
    res.render('forgot_password', {
        title: 'Forgot Password'
    })
})

// Forgot password - POST
router.post('/forgot-password', (req, res) => {
    
    const email = req.body.email

    User.findOne({"email": email }, (err, foundUser) => {
        if(err) {
            throw(err)
        } else {

            var transporter = nodemailer.createTransport({
            service: userAuth.tMail,
            auth: {
                    user: userAuth.uName,
                    pass: userAuth.pW
                }
            });

            ForgotPassword.create({email: email})
                .then(createdFoundPassword => {
                    const mailOptions = {
                        from: userAuth.uName, // sender address
                        to: email, // list of receivers
                        subject: 'Gulapagadgets - Forgot Password', // Subject line
                        html: `<h2>Hi ${foundUser.name}</h2>
                        <br><br>
                        <p>Click the link to change your password.</p>
                        <br>
                        <a href="http://localhost:2000/users/forgot-password/${foundUser._id}/${createdFoundPassword._id}">Change password</a>`// plain text body
                    };
                    transporter.sendMail(mailOptions)
                        .then(info => {
                            req.flash('success', 'We will send you an email if your email is in our system')
                            res.redirect('/users/login');
                        })
                        .catch(err => console.log(err))
                })
                .catch(err => console.log(err))
        }
    })

})

router.get('/forgot-password/:id/:change_pass_id', (req, res) => {
    
    const id = req.params.id
    const change_pass_id = req.params.change_pass_id

    ForgotPassword.findById(change_pass_id)
        .then(foundForgotPW => {
            User.findById(id)
                .then(foundUser => {
                    res.render('forgot_password_submit', {
                        title: 'Forgot Password',
                        id,
                        change_pass_id
                    })
                })
                .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
})

router.post('/forgot-password/:id/:change_pass_id', (req, res) => {
    
    const id = req.params.id
    const change_pass_id = req.params.change_pass_id
    var password = req.body.password;
    const password2 = req.body.password2;
    

    req.checkBody('password', 'Password is required!').notEmpty();
    req.checkBody('password2', 'Passwords do not match!').equals(password);

    var errors = req.validationErrors();

    ForgotPassword.findById(change_pass_id)
        .then(foundForgotPW => {
            if (errors) {
                req.flash('danger', 'Make sure that fill up all fields and Password should match')
                res.redirect(`/users/forgot-password/${id}/${change_pass_id}`);
            }
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(password, salt, function (err, hash) {
                    if (err)
                        console.log(err);

                    password = hash;

                    User.updateOne({_id: id}, {$set: {"password": password}})
                        .then(foundUser => {
                            ForgotPassword.findByIdAndDelete(change_pass_id)
                                .then(() => {
                                    req.flash('success', 'Your Password is changed')
                                    res.redirect('/users/login');
                                })
                                .catch(err => console.log(err))
                        })
                        .catch(err => console.log(err))
                    
                });
            });

            
        })
        .catch(err => console.log(err))
    
})

// Exports
module.exports = router;