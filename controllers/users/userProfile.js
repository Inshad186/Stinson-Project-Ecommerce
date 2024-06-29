const User = require("../../models/userModel");
const bcrypt = require("bcrypt")
const Address = require("../../models/addressModel")
const Order = require("../../models/orderModel")

exports.viewUserProfile = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send("Unavailable UserId");
        }
        const user = await User.findById(userId);
        const userAddress = await Address.find({userId:userId})
        const userOrders = await Order.find({ userId:userId })

        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("users/user-profile", { user ,userAddress ,userOrders });
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send("User not authenticated");
        }

        const orders = await Order.find({ userId }).populate({
            path: 'orderItems.variantId',
            select: 'productName'
        });

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.log("Error in getUserOrders", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};



exports.updateUserProfile = async (req, res) => {

    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send("Unavailable UserId");
        }
        const { name, mobile } = req.body;
        parseInt(mobile)

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).send("User not found");
        }
        await User.findByIdAndUpdate(userId, { $set: { name: name, mobile: mobile } });

        res.status(200).json({ message: "Profile updated successfully" });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};




exports.insertAddress = async (req, res) => {
    try {
        const { name, phone, city, pincode, postoffice, landMark, state } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const addressIsExisting = await Address.findOne({ userId });

        const addressData = new Address({
            userId,
            name,
            mobile:phone,
            city,
            pincode,
            postOffice:postoffice,
            landMark,
            state
        });
        const savedAddress = await addressData.save();

        res.status(200).json({ success: "Address added successfully", address: savedAddress });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
};


exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const addressId = req.params.id;

        if (!userId) {
            return res.status(401).send("Unavailable UserId");
        }

        const address = await Address.findOneAndDelete({ _id: addressId, userId: userId });

        if (!address) {
            return res.status(404).send("Address not found");
        }

        res.status(200).send("Address deleted successfully");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};


exports.editAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const updatedData = req.body;

        const updatedAddress = await Address.findByIdAndUpdate(addressId, updatedData, { new: true });

        if (!updatedAddress) {
            return res.status(404).send("Address not found");
        }
        res.json(updatedAddress);
    } catch (error) {
        console.log("error in editAddress",error);
        res.status(500).send("Server Error");
    }
};



exports.changePassword = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { currentpass, newPassword, confirmpass } = req.body;

        if (!userId) {
            return res.status(401).send("Unauthorized: No userId found");
        }
        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).send("User not found");
        }
        const isMatch = await bcrypt.compare(currentpass, user.password);

        if (!isMatch) {
            return res.status(400).send("Current password is incorrect");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.status(200).send("Password updated successfully");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
};


// exports.checkOutAddress = async(req,res)=>{
//     try {
//         const userId = req.session.userId

//         if(!userId){
//             return res.status(401).send("Unavailable")
//         }
//         const address = await Address.findOne({userId})

//         res.render('checkout', { address });
        
//     } catch (error) {
//         console.log("message in checkOutAddress",error);
//         res.status(500).send("Server Error")
//     }
// }


