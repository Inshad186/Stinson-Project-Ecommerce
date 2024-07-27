const adminUser = require("../../models/userModel")
const User = require("../../models/userModel")
const Product = require("../../models/productModel")
const Order = require("../../models/orderModel")
const Category = require("../../models/categoryModel")
const asyncHandler = require('express-async-handler');


exports.Dashboard = async(req,res)=>{
    try {
        const isAdminLoggedIn = req.session.userId !== undefined;

        const totalUser = await User.countDocuments({})
        const totalOrder = await Order.countDocuments({})
        const totalProduct = await Product.countDocuments({})
        const totalCategory = await Category.countDocuments({})
        console.log(`User : ${totalUser} , Order : ${totalOrder} , Product : ${totalProduct} , Category : ${totalCategory}`);
 

        let filter = await Order.find( {'orderItems.orderStatus': { $in: ['Delivered', 'Completed'] }});

        const totalRevenue = filter.reduce((acc, order) => acc + order.grandTotal, 0);
        console.log("REVENUE  :  ",totalRevenue);


        res.render("admin/dashboard" ,{isAdminLoggedIn, totalUser, totalOrder, totalProduct, totalCategory, totalRevenue})
    } catch (error) {
        console.log(error.message);
    }
}


exports.getChartData = asyncHandler(async (req, res) => {
    const { filter, startDate, endDate } = req.query;

    let start, end;
    const now = new Date();
    
    if (filter === 'yearly') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
    } else if (filter === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (filter === 'weekly') {
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        end = new Date(now.setDate(now.getDate() + 6));
    } else if (filter === 'daily') { // Added daily filter
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
    } else if (filter === 'date-range') {
        start = new Date(startDate);
        end = new Date(endDate);
    } else {
        start = new Date(0);
        end = new Date();
    }

    console.log(`Filter: ${filter}, Start Date: ${start}, End Date: ${end}`);

    try {
        const bestSellingProducts = await Order.aggregate([
            { $match: { orderDate: { $gte: start, $lte: end } } },
            { $unwind: '$orderItems' },
            { $group: { _id: '$orderItems.variantName', totalSold: { $sum: '$orderItems.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        const bestSellingCategories = await Order.aggregate([
            { $match: { orderDate: { $gte: start, $lte: end } } },
            { $unwind: '$orderItems' },
            { $lookup: { from: 'varients', localField: 'orderItems.variantId', foreignField: '_id', as: 'variantDetails' } },
            { $unwind: '$variantDetails' },
            { $group: { _id: '$variantDetails.categoryName', totalSold: { $sum: '$orderItems.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        const bestSellingBrands = await Order.aggregate([
            { $match: { orderDate: { $gte: start, $lte: end } } },
            { $unwind: "$orderItems" },
            { $lookup: { from: 'varients', localField: 'orderItems.variantId', foreignField: '_id', as: 'variantDetails' } },
            { $unwind: '$variantDetails' },
            { $lookup: { from: 'products', localField: 'variantDetails.productId', foreignField: '_id', as: 'productDetails' } },
            { $unwind: '$productDetails' },
            { $group: { _id: '$productDetails.brand', totalSold: { $sum: 1 } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        console.log('Best Selling Products:', bestSellingProducts);
        console.log('Best Selling Categories:', bestSellingCategories);
        console.log('Best Selling Brands:', bestSellingBrands);

        res.json({
            bestSellingProducts,
            bestSellingCategories,
            bestSellingBrands
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).send(error.message);
    }
});
