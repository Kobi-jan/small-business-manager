module.exports = function checkProfileCompletion(req, res, next) {
    if (req.path === '/owner/dashboard/complete-profile') {
        return next(); 
    }

    if (!req.session.user) {
        console.error('Session missing or expired.');
        return res.redirect('/auth/login'); // Redirect to login if session is missing
    }

    if (req.session.user.isProfileComplete === false) {
        return res.redirect('/owner/dashboard/complete-profile');
    }

    next();
};
