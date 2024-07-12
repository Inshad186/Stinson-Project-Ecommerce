const errorHandler = (err,req,res,next) => {
    console.error(err);
    res.status(400).render("users/error-404",{error:err})
};

module.exports = errorHandler