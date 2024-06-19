const adminUser = require("../../models/userModel")

exports.Dashboard = async(req,res)=>{
    try {
        res.render("admin/dashboard")
    } catch (error) {
        console.log(error.message);
    }
}
