const User = require("../../models/userModel")
const Categories = require("../../models/categoryModel")

const loadHome = async(req,res)=>{
    try {
        const category = await Categories.find({})

        const isLoggedIn = req.session.userId !== undefined;

        res.render("users/home",{category , isLoggedIn})
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = loadHome;