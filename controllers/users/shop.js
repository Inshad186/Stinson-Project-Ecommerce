const Product = require("../../models/productModel")
const Variant = require("../../models/varientModel")

exports.viewshopList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const category = req.query.category || '';
        const searchQuery = req.query.search || '';
        const sortBy = req.query.sortBy || 'priceAsc';

        const startIndex = (page - 1) * limit;

        const categoryFilter = category ? { categoryName: category, is_Delete: false } : { is_Delete: false };

        if (searchQuery) {
            categoryFilter.productName = { $regex: searchQuery, $options: 'i' }; // Case-insensitive search
        }

        let sortOptions = {};

        switch (sortBy) {
            case 'priceAsc':
                sortOptions = { salePrice: 1 };
                break;
            case 'priceDesc':
                sortOptions = { salePrice: -1 };
                break;
            case 'nameAsc':
                sortOptions = { productName: 1 };
                break;
            case 'nameDesc':
                sortOptions = { productName: -1 };
                break;
            default:
                sortOptions = { salePrice: 1 };
        }

        const totalVariants = await Variant.countDocuments(categoryFilter);
        const variants = await Variant.find(categoryFilter)
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit);

        res.render("users/shopList", {
            variants,
            currentPage: page,
            totalPages: Math.ceil(totalVariants / limit),
            limit: limit,
            selectedCategory: category,
            sortBy: sortBy,
            searchQuery: searchQuery
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
        next(error)
    }
};



exports.productDetail = async (req, res, next) => {
    try {
        const variantId = req.query.id;
        const variant = await Variant.findOne({ _id: variantId });

        if (!variant) {
            const error = new Error("Variant not found");
            error.status = 404;
            throw error;
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
        error.status = 500;
        next(error);
    }
};







