
const isAuthenticated = async(req,res,next) => {
    try {
        if(!req.session.userId) {
            return res.redirect('/admin/signin')
        }
        next();

    } catch (error) {
        console.log(error.message)
    }
}

const isUnAuthenticated = (req, res, next) => {
    try {
        if (req.session.userId) {
            return res.redirect('/admin/dashboard');
        }
        next();

    } catch (error) {
        console.log(error.message)
    }
};


module.exports = {
    isAuthenticated,
    isUnAuthenticated,
};