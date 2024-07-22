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

        const totalRevenue = filter.reduce((acc, order) => acc + order.subTotal, 0);
        console.log("REVENUE  :  ",totalRevenue);


        res.render("admin/dashboard" ,{isAdminLoggedIn, totalUser, totalOrder, totalProduct, totalCategory, totalRevenue})
    } catch (error) {
        console.log(error.message);
    }
}


exports.getChartData = asyncHandler(async (req, res) => {
    const { filter } = req.query;

    let startDate, endDate;
    const now = new Date();
    if (filter === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
    } else if (filter === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (filter === 'weekly') {
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        endDate = new Date(now.setDate(now.getDate() + 6));
        startDate = new Date(now.setDate(startOfWeek));
        endDate = new Date(now.setDate(endOfWeek));
    } else {
        startDate = new Date(0);
        endDate = new Date();
    }

    try {
        // Aggregation for best-selling products
        const bestSellingProducts = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: '$orderItems' },
            { $group: { _id: '$orderItems.variantName', totalSold: { $sum: '$orderItems.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        // Aggregation for best-selling categories
        const bestSellingCategories = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: '$orderItems' },
            {
                $lookup: {
                    from: 'varients',
                    localField: 'orderItems.variantId',
                    foreignField: '_id',
                    as: 'variantDetails'
                }
            },
            { $unwind: '$variantDetails' },
            { $group: { _id: '$variantDetails.categoryName', totalSold: { $sum: '$orderItems.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);
        
        // Aggregation for best-selling brands
        const bestSellingBrands = await Order.aggregate([
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $unwind: "$orderItems" },
            {
                $lookup: {
                    from: 'varients',
                    localField: 'orderItems.variantId',
                    foreignField: '_id',
                    as: 'variantDetails'
                }
            },
            { $unwind: '$variantDetails' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variantDetails.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $group: {
                    _id: '$productDetails.brand',
                    totalSold: { $sum: '$orderItems.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        console.log('Best Selling Products:', bestSellingProducts);
        console.log('Best Selling Categories:', bestSellingCategories);
        console.log('Best Selling Brands:', bestSellingBrands);

        res.json({
            bestSellingProducts,
            bestSellingCategories,
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});



