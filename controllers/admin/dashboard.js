const adminUser = require("../../models/userModel")

exports.Dashboard = async(req,res)=>{
    try {
        const isAdminLoggedIn = req.session.userId !== undefined;
        res.render("admin/dashboard" ,{isAdminLoggedIn})
    } catch (error) {
        console.log(error.message);
    }
}
