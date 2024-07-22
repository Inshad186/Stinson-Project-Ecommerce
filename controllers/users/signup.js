const User = require("../../models/userModel");
const { generateOTP } = require("../../utils/generateOtp");
const OTP = require("../../models/otpModel");
const sendEmail = require("../../utils/sendmailer");
const bcrypt = require("bcrypt")



const loadSignup = async (req, res) => {
    try {
        res.render("users/signup")
    } catch (error) {
        console.log(error.message);
    }
}


const insertUser = async (req, res) => {
    try {

        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        const sPassword = await securePassword(req.body.password)

        const { name, email, phone } = req.body
        const user = new User({
            name,
            email,
            mobile: phone,
            password: sPassword
        });
        const savedUser = await user.save()
        console.log("Signup Details : ", savedUser);

        const otpCode =  generateOTP();
        console.log('first otp ',otpCode);
        const saveOtp = new OTP({
            email,
            otp: otpCode
        })
        const savedOtp = await saveOtp.save()

        req.session.email = email

        await sendEmail(savedUser.email, savedOtp.otp)

        res.status(200).json({ success: true, message: "This is valid" })

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

////////////!     Load Otp      ////////////

const loadOtp = async (req, res) => {
    try {
        res.render("users/otp");
    } catch (error) {
        console.log(error.message);
    }
}

const resendOTP = async (req, res) => {
    try {
        const email = req.session.email;
        const newOTP = generateOTP();
        const NEWotp = new OTP({
            email: email,
            otp: newOTP
        });
        const savedOtp = await NEWotp.save();

        await sendEmail(email, savedOtp.otp);

        res.status(200).json({ success: true, message: "New OTP sent successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'An error occurred while resending OTP' });
    }
};


const checkotp = async (req, res) => {
    try {
        const { otp } = req.body
        const email = req.session.email

        const isOtpCorrect = await OTP.findOne({ email: email });


        if (isOtpCorrect && isOtpCorrect.otp === otp) {
            await User.findOneAndUpdate(
                { email: email },
                { $set: { is_Verified: true } },
                { new: true }
            );
            return res.status(200).json({ success: true, message: "Pleace check out " })
        }

        res.status(404).json({ success: false, message: "This is OTP" })

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
}

////////////!     Load login      ////////////

const loadLogin = async (req, res) => {
    try {
        res.render("users/login")
    } catch (error) {
        console.log(error.message);
    }
}



const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and Password are required" });
        }
        
        const userData = await User.findOne({ email });
        
        if (!userData) {
            return res.status(401).json({ success: false, message: "No user with this email" });
        }

        if (userData.is_Block) {
            return res.status(403).json({ success: false, message: "User is blocked" });
        }    
        
        const isPasswordMatch = await bcrypt.compare(password, userData.password);
        
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        req.session.userId = userData._id; 
        req.session.isAuthenticated = true;

        res.json({ success: true });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



const logout = (req, res) => {
    try {
        delete req.session.userId;
        res.redirect('/login');

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



const securePassword = async (password) => {
    try {
        const hashPassword = await bcrypt.hash(password, 10)
        return hashPassword;
    } catch (error) {
        console.log(error.message);
    }
}



googleSignin = async (req, res) => {
    try {
        const { name, email } = req.body;

        const regexPattern = new RegExp(`^${email}$`, 'i');
        let user = await User.findOne({ email: regexPattern });
        console.log(email, name)

        if (user) {
            req.session.userId = user._id;
            req.session.isAuthenticated = true;
            return res.status(200).json({ success: true });
        }

        user = new User({
            name,
            email
        });

        const savedUser = await user.save();

        req.session.userId = savedUser._id;
        req.session.isAuthenticated = true;

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};




module.exports = {
    loadSignup,
    insertUser,
    loadOtp,
    resendOTP,
    checkotp,
    loadLogin,
    verifyLogin,
    logout,
    googleSignin
}
