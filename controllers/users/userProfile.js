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

        const walletPage = parseInt(req.query.walletPage) || 1;
        const walletLimit = parseInt(req.query.walletLimit) || 6; 
        const walletSkip = (walletPage - 1) * walletLimit;

        const totalTransactions = wallet ? wallet.transactions.length : 0;
        const totalWalletPages = Math.ceil(totalTransactions / walletLimit);
        const transactions = wallet ? wallet.transactions.slice(walletSkip, walletSkip + walletLimit) : [];

        console.log("Transactions: ", transactions);

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
            wallet: {
                balance: wallet ? wallet.balance : 0,
                transactions: transactions
            },
            walletCurrentPage: walletPage,
            totalWalletPages: totalWalletPages,
            walletLimit: walletLimit
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


exports.cancelOrder = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const { orderId, variantId } = req.body;

        const order = await Order.findOne({ userId: userId, _id: orderId });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const product = order.orderItems[0]

        if (!product) {
            return res.status(404).json({ error: 'Order item not found' });
        }

        let refundAmount = product.variantPrice * product.quantity;

        if (order.couponDetails && order.couponDetails.couponCode) {
            const coupon = order.couponDetails;
            const discount = (product.variantPrice * (coupon.discountPercentage / 100)) * product.quantity;
            const maxDiscount = Math.min(discount, coupon.maxDiscountAmount);
            refundAmount -= maxDiscount / order.orderItems.length;
        }

        let wallet = await Wallet.findOne({ userId: userId });
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

        order.orderItems = order.orderItems.filter(item => !item.variantId.equals(variantId));

        if (order.orderItems.length === 0) {
            order.status = 'Cancelled';
        }

        await order.save();

        res.json({ message: 'Order canceled and refund added to wallet' });
    } catch (error) {
        next(error);
    }
};


exports.getWalletTransactions = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const { page = 1, limit = 6 } = req.query;

        const wallet = await Wallet.findOne({ userId: userId });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const transactions = wallet.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice((page - 1) * limit, page * limit);

        const totalTransactions = wallet.transactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        res.json({
            transactions,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        next(error);
    }
};


exports.returnOrder = async (req, res) => {
    try {
        const { orderId, variantId, reason } = req.body;
        const order = await Order.findById(orderId);

        console.log("ORDERRRR  :  ",order);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const orderItem = order.orderItems[0]
        console.log("OORRDEER  ITTEEEMM  : ",orderItem);
        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }

        if (orderItem.orderStatus !== 'Delivered') {
            return res.status(400).json({ error: 'Order is not delivered yet' });
        }
        orderItem.orderStatus = 'Return requested'
        orderItem.returnReason = reason;

        await order.save()
        
        res.json({ message: 'Your return request placed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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
            select: 'size salePrice stock colour image productName categoryName offerDiscount'
        });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        let subTotal = 0;
        cart.products.forEach(product => {
            const variant = product.productVariantId;
            let discountPrice = variant.salePrice;
            if (variant.offerDiscount) {
                discountPrice = variant.salePrice - (variant.salePrice * variant.offerDiscount / 100);
            }
            product.discountPrice = parseInt(discountPrice);
            subTotal += product.discountPrice * product.quantity;
        });

        const coupon = await Coupons.findOne({ couponCode });

        if (!coupon) {
            return res.status(404).json({ message: "Invalid coupon code" });
        }

        if (coupon.listed) {
            return res.status(400).json({ message: "This coupon is not available" });
        }

        if (subTotal < coupon.minPurchaseAmount) {
            return res.status(400).json({ message: `Purchase at least for ${coupon.minPurchaseAmount} to avail this coupon` });
        }

        const discount = Math.min(subTotal * (coupon.discountPercentage / 100), coupon.maxRedeemAmount);
        const newTotal = (subTotal - discount)+50;

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



exports.insertAddress = async (req, res) => {
    try {
        const { name, phone, city, pincode, postoffice, landMark, state } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const nameRegex = /^[^\s][a-zA-Z\s]*[^\s]$/;
        const mobileRegex = /^(\+?\d{1,3}[- ]?)?(6|7|8|9)\d{9}$/;
        const pincodeRegex = /^\d{6}$/;

        if (!nameRegex.test(name)) {
            return res.status(400).json({ error: "Invalid name format." });
        }

        if (!mobileRegex.test(phone)) {
            return res.status(400).json({ error: "Invalid phone number format." });
        }

        if (!pincodeRegex.test(pincode)) {
            return res.status(400).json({ error: "Invalid pincode format." });
        }

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




