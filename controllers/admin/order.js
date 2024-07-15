const Order = require("../../models/orderModel")
const Wallet = require("../../models/walletModel")
const User = require("../../models/userModel")
const Address = require("../../models/addressModel")
const Variant = require("../../models/varientModel")
const asyncHandler = require("express-async-handler");


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

        // if(newStatus === "Delivered"){

        //     await Order.findOneAndUpdate(
        //         { _id: orderId, 'orderItems.variantId': variantId },
        //         { $set: { 'orderItems.$.orderStatus': 'Request Return' } }
        //     );
        //     console.log("Status changed to Request Return successfully.");

        // } else 
        if(newStatus === "Refunded"){

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



exports.viewSalesReport = asyncHandler(async (req, res) => {
    let orders = await Order.find().populate('userId');
  
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('userId');
    } else if (['day', 'week', 'month'].includes(req.query.range)) {
      const ranges = {
        day: 1,
        week: 7,
        month: 30
      };
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - ranges[req.query.range]);
      orders = await Order.find({
        createdAt: { $gte: startDate }
      }).populate('userId');
    }
  
    const filteredOrders = [];
    let overallSalesCount = 0;
    let overallOrderAmount = 0;
    let overallDiscount = 0;
  
    for (const order of orders) {
      const deliveredProducts = order.orderItems.filter(product => product.orderStatus === 'Delivered');
  
      for (const product of deliveredProducts) {
        const productVariant = await Variant.findById(product.variantId);
        const offerDiscount = productVariant.offerDiscount ? productVariant.offerDiscount : 0;
        const offerAmount = (product.variantPrice * offerDiscount) / 100;
  
        overallSalesCount += product.quantity;
        overallOrderAmount += product.quantity * product.variantPrice;
        overallDiscount += offerAmount * product.quantity;
  
        filteredOrders.push({
          orderId: order._id,
          orderDate: new Date(order.createdAt).toLocaleDateString(),
          productName: product.variantName,
          customer: order.shippingAddress.name,
          paymentMode: order.paymentMethod,
          status: product.orderStatus,
          offerDiscount: `₹${offerAmount.toFixed(2)} (${offerDiscount}%)`,
          couponDiscount: order.couponDetails ? `₹${order.couponDetails.claimedAmount}` : '₹0',
          productSubtotal: `₹${(product.quantity * product.variantPrice).toFixed(2)}`
        });
      }
    }
  
    res.status(200).render('admin/salesReport', {
      orders: filteredOrders,
      overallSalesCount,
      overallOrderAmount,
      overallDiscount
    });
  });
  
  


