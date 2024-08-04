
exports.viewContact = async(req,res,next)=>{
    try {
        res.render("users/contact")
    } catch (error) {
        console.log("Erron in View Contact",viewContact);
        next(error)
    }
}