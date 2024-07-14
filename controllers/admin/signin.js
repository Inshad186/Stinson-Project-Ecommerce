const bcrypt = require("bcrypt")
const AdminUser = require("../../models/userModel")

exports.signin = async(req,res)=>{
    try {
        res.render("admin/signin")
    } catch (error) {
        console.log(error.message);
    }
}



exports.verifySignin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email);

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and Password are required" });
        }

        const adminData = await AdminUser.findOne({ email: email });
        if (!adminData) {
            return res.status(401).json({ success: false, message: "No admin with this email" });
        }

        if(adminData.is_Admin === true){

        const isPasswordMatch = await bcrypt.compare(password, adminData.password);
        if (!isPasswordMatch) {
            return res.status(401).json({success:false , message : "Incorrect password"});
        }

        req.session.userId = adminData._id; 
        req.session.isAuthenticated = true;
        req.session.isAdmin = true;

        return res.json({ success:true });
    }else{

        return res.status(401).json({success:false , message : "Incorrect password or email"});
    }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



exports.securePassword = async (password) => {
    try {
        const hashPassword = await bcrypt.hash(password, 10);
        return hashPassword;
    } catch (error) {
        console.log(error.message);
    }
};