

exports.viewAbout = async(req, res, next)=>{
    try {
        res.render("users/about")
    } catch (error) {
        console.error("Error in viewCart", error);
        next(error);
    }
}