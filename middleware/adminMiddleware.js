
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
        // console.log('auth success', req.session.userId)
    } else {
        res.redirect('/signin');
        console.log('auth failed')
    }
};

const isUnAuthenticated = (req, res, next) => {
    if(req.session.userId){
        res.redirect('/admin/dashboard');
        console.log('auth failed')
    }
    else{
        next();
        // console.log('auth success', req.session.userId)
    }
}

module.exports = {
    isAuthenticated,
    isUnAuthenticated,
};