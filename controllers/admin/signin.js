const bcrypt = require("bcrypt")
const AdminUser = require("../../models/userModel")

exports.signin = async(req,res)=>{
    try {
        res.render("admin/signin")
    } catch (error) {
        console.log(error.message);
    }
}

// exports.verifySignin = async(req,res)=>{
//     try {
//         const { email, password } = req.body;
//         console.log(email);

//         req.session.email = email

//         if(!email || !password){
//             return res.status(400).json({ success:false, message : "Email and Password are required"})
//             }

//         const adminData = await AdminUser.findOne({email:email})
//         if (!adminData) {
//             return res.status(401).json({success:false , message : "no admin with this email"})
//             }
//         console.log(adminData);

//         if(adminData && adminData.password == password && adminData.is_Admin){
//             res.status(200).json({success:true , message:"This is valid Admin User"})
//         }else{
//             res.status(404).json({success:false , message:"This is invalid admin User"})
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// }



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

        console.log(adminData);

        const isPasswordMatch = await bcrypt.compare(password, adminData.password);
        if (!isPasswordMatch) {
            return res.status(401).json({success:false , message : "Incorrect password"});
        }

        req.session.userId = adminData._id; 
        req.session.isAuthenticated = true;

        res.json({ success:true });
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