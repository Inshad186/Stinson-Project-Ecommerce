const Order = require("../../models/orderModel")
const Variant = require("../../models/varientModel")


exports.loadOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        console.log("User idddd : ",userId);

        if (!userId) {
            return res.status(401).send("User not authenticated");
        }

        const orders = await Order.find({})

        console.log("Ordersassss  ",orders);

        res.render("admin/order",{orders})
    } catch (error) {
        console.log("Error in getUserOrders", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};