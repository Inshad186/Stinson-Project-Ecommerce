const User = require("../../models/userModel");
const bcrypt = require("bcrypt")
const Address = require("../../models/addressModel")
const Order = require("../../models/orderModel")
const Coupons = require("../../models/couponModel")
const Cart = require("../../models/cartModel")
const Wallet = require("../../models/walletModel")


exports.viewUserProfile = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send("Unavailable UserId");
        }

        const user = await User.findById(userId);
        const userAddress = await Address.find({ userId: userId });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; 
        const skip = (page - 1) * limit;

        const userOrders = await Order.find({ userId: userId })
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit);
        const totalOrders = await Order.countDocuments({ userId: userId });

        const userCoupons = await Coupons.find({listed:false});

        const wallet = await Wallet.findOne({ userId: userId });


        if (!user) {
            return res.status(404).send("User not found");
        }

        res.render("users/user-profile", {
            user,
            userAddress,
            userOrders,
            userCoupons,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            limit,
            wallet
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


exports.cancelOrder = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const orderId = req.body.orderId;

        const order = await Order.findOne({ userId: userId, _id: orderId });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.status = 'canceled';
        await order.save();

        let wallet = await Wallet.findOne({ userId: userId });
        const refundAmount = order.grandTotal;
        const transaction = {
            amount: refundAmount,
            transactionMethod: 'Refund',
            date: new Date()
        };

        if (wallet) {
            wallet.balance += refundAmount;
            wallet.transactions.push(transaction);
        } else {
            wallet = new Wallet({
                userId: userId,
                balance: refundAmount,
                transactions: [transaction]
            });
        }

        await wallet.save();

        res.json({ message: 'Order canceled and refund added to wallet' });
    } catch (error) {
        next(error);
    }
};




exports.applyCoupon = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { couponCode } = req.body;

        if (!userId) {
            return res.status(401).send("User not authenticated");
        }

        const cart = await Cart.findOne({ userId }).populate({
            path: 'products.productVariantId',
            select: 'size salePrice stock colour image productName categoryName'
        });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        let subTotal = 0;
        cart.products.forEach(product => {
            subTotal += product.productVariantId.salePrice * product.quantity;
        });

        if (subTotal < 3000) {
            return res.status(400).json({ message: "Purchase at least for 3000 to avail this coupon" });
        }

        const coupon = await Coupons.findOne({ couponCode });

        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon code" });
        }
        const discount = (subTotal * coupon.discountPercentage) / 100;
        const newTotal = subTotal - discount;

        res.status(200).json({ discount, newTotal, couponId: coupon._id });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
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



exports.getUserOrders = async (req, res) => {
    try {
        console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO"  );
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send("User not authenticated");
        }

        const orders = await Order.find({ userId }).populate({
            path: 'orderItems.variantId',
            select: 'productName'
        });
        console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO     :     ",orders);

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.log("Error in getUserOrders", error);
        return res.status(500).json({ success: false, message: "Server Error" });
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

        if(currentpass === newPassword){
            return res.status(400).send("Current password and new password must be different")
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


