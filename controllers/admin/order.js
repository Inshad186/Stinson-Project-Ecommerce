const Order = require("../../models/orderModel")
const Wallet = require("../../models/walletModel")
const User = require("../../models/userModel")
const Address = require("../../models/addressModel")
const Variant = require("../../models/varientModel")


exports.loadOrder = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send("User not authenticated");
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        const ordersCount = await Order.countDocuments({ userId: userId });
        const totalPages = Math.ceil(ordersCount / limit);

        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log("Ordersassss  ", orders);

        res.render("admin/order", {
            orders,
            currentPage: page,
            totalPages: totalPages,
            limit: limit
        });
    } catch (error) {
        console.log("Error in getUserOrders", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};


exports.loadOrderDetails = async (req, res) => {
    try {
        const orderId = req.query.orderId

        if (!orderId) {
            return res.status(400).send("Order ID is required");
        }
        const order = await Order.findById(orderId).populate('userId');

        if (!order) {
            return res.status(404).send("Order not found");
        }
        const statusChanges = {
            Pending: ['Processing', 'Cancelled'],
            Processing: ['Shipped', 'Cancelled'],
            Shipped: ['Delivered'],
            'Return requested': ['Return approved', 'Return Rejected'],
            'Return approved': ['Refunded'],
            'Return Rejected': [],
            Delivered: [],
            Cancelled: [],
            Returned: [],
            Refunded:[]
        }
        res.render("admin/orderDetail",{order,statusChanges });
    } catch (error) {
        console.log("Error in loadOrderDetails", error);
        return res.status(500).send("Server Error");
    }
};


exports.updateOrderStatus = async (req, res) => {
    try {

        const { orderId, variantId, newStatus } = req.body;

        if (!orderId || !variantId || !newStatus) {
            return res.status(400).send("Order ID, Variant ID, and New Status are required");
        }
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send("Order not found");
        }
        const item = order.orderItems.find(item => item.variantId.equals(variantId))
        console.log('itemmmmmmmmmmmmmmmm  :  ',item);

        if (!item) {
            return res.status(404).send("Order item not found");
        }

        if(newStatus === "Delivered"){

            await Order.findOneAndUpdate(
                { _id: orderId, 'orderItems.variantId': variantId },
                { $set: { 'orderItems.$.orderStatus': 'Request Return' } }
            );
            console.log("Status changed to Request Return successfully.");

        } else if(newStatus === "Refunded"){

            const orderDetail = await Order.findOne({_id: orderId,'orderItems.variantId': variantId})

            if(orderDetail) {
                const variantDetails = orderDetail.orderItems.find(item => item.variantId.equals(variantId))
                console.log("Variant DEatails  :  ",variantDetails);

                const quantity = parseInt(variantDetails.quantity)
                console.log("Quantity  :  ",quantity);
                
                const productPrice = parseInt(variantDetails.variantPrice)
                console.log("Product Price  : ",productPrice);

                let refundedAmount = parseInt(quantity * productPrice);
                console.log("Refund Amount  :  ",refundedAmount);

                await Wallet.findOneAndUpdate(
                    { userId: order.userId },{$push: {transactions: {amount: refundedAmount,transactionMethod: 'Refund'}},
                        $inc: { balance: refundedAmount }},
                    { upsert: true, new: true }
                );
                console.log("Refund processed successfully.");
            }

            await Order.findOneAndUpdate(
                { _id: orderId, 'orderItems.variantId': variantId },
                { $set: { 'orderItems.$.orderStatus': newStatus } }
            );

           }else{
            await Order.findOneAndUpdate(
                { _id: orderId, 'orderItems.variantId': variantId },
                { $set: { 'orderItems.$.orderStatus': newStatus } }
              );
        }
        return res.status(200).json({success:"status changed successfully"})
    } catch (error) {
        console.log("Error in updateOrderStatus", error);
        return res.status(500).send("Server Error");
    }
};


