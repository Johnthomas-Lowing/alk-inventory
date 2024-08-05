// middleware/auth.js

export function isAuthenticated(req, res, next) {
    if (req.session.username) {
        return next();
    } else {
        res.redirect('/index.html'); // Redirect to the homepage if not authenticated
    }
}

