const Product = require("../../models/productModel")
const Variant = require("../../models/varientModel")

exports.viewshopList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const category = req.query.category || '';

        const startIndex = (page - 1) * limit;

        const categoryFilter = category ? { categoryName: category, is_Delete: false } : { is_Delete: false };

        const totalVariants = await Variant.countDocuments(categoryFilter);
        const variants = await Variant.find(categoryFilter)
            .skip(startIndex)
            .limit(limit);

        res.render("users/shopList", {
            variants,
            currentPage: page,
            totalPages: Math.ceil(totalVariants / limit),
            limit: limit,
            selectedCategory: category 
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};




exports.productDetail = async (req, res) => {
    try {
        const variantId = req.query.id;
        const variant = await Variant.findOne({ _id: variantId });

        if (!variant) {
            return res.status(404).send("Variant not found");
        }

        const stockWithStatus = variant.size.map((size, index) => ({
            size: size,
            status: variant.stock[index] > 0 ? 'In stock' : 'Out of stock'
        }));

        const productId = variant.productId;
        const otherVariants = await Variant.find({ productId });

        const colors = [variant.colour];
        const sizes = variant.size;

        res.render("users/productDetail", { variant, stockWithStatus, colors, sizes, otherVariants });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};







