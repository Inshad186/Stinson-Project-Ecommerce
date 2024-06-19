
// const isAuthenticated = (req, res, next) => {
//     if (req.session.userId) {
//         next();
//         console.log('auth success', req.session.userId)
//     } else {
//         res.redirect('/login');
//         console.log('auth failed')
//     }
// };

const isUnAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        console.log('auth failed');
        return res.redirect('/');
    }
    next();
};


module.exports = {
    isUnAuthenticated,
};
