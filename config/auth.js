// Middlewares

exports.isUser = function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('danger', 'Please log in.');
        res.redirect('/users/login');
    }
}

exports.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        next();    
    }
}

exports.isAdmin = function(req, res, next) {
    if (req.isAuthenticated() && res.locals.user.admin == 1) {
        next();
    } else {
        req.flash('danger', 'Please log in as admin.');
        res.redirect('/users/login');
    }
}

exports.isDelivery = function(req, res, next) {
    if (req.isAuthenticated() && res.locals.user.admin == 2) {
        next();
    } else {
        req.flash('danger', 'Please log in as delivery distributor.');
        res.redirect('/users/login');
    }
}
