const Order = require("../../models/orderModel")
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

        const orders = await Order.find({ userId: userId })
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
