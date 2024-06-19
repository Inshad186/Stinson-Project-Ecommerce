const User = require("../../models/userModel")

exports.user = async(req,res)=>{
    try {
        const userData = await User.find({is_Admin : false})
        res.render("admin/userDetails",{userData : userData})
    } catch (error) {
        console.log(error.message);
    }
}



exports.blockUser = async(req,res)=>{
    try {
        const userData = await User.findOne({_id:req.body.userId})
        userData.is_Block = !userData.is_Block
        const saveData = await userData.save()
        res.status(200).json({success:true , userState:saveData.is_Block})
    } catch (error) {
        console.log(error.message);
    }
}

