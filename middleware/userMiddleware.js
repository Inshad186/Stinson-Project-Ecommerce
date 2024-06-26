
const isAuthenticated = async(req,res,next) => {
    try {
        if(!req.session.userId) {
            return res.redirect('/login')
        }
        next();

    } catch (error) {
        console.log(error.message)
    }
}

const isUnAuthenticated = (req, res, next) => {
    try {
        if (req.session.userId) {
            return res.redirect('/');
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
