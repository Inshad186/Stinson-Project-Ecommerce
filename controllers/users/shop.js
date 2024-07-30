const Variant = require("../../models/varientModel")
const Offer = require("../../models/offerModel")


exports.viewshopList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const category = req.query.category || '';
        const searchQuery = req.query.search || '';
        const sortBy = req.query.sortBy || 'priceAsc';

        const startIndex = (page - 1) * limit;

        let categoryFilter = { 'categoryDetails.is_Delete': false, 'productDetails.is_Delete': false, is_Delete: false };

        if (category) {
            categoryFilter['categoryDetails.name'] = category;
        }

        if (searchQuery) {
            categoryFilter.productName = { $regex: searchQuery, $options: 'i' };
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

        // Use an aggregation pipeline to filter out variants with deleted categories or products
        const totalVariants = await Variant.aggregate([
            { $lookup: { from: 'categories', localField: 'categoryName', foreignField: 'name', as: 'categoryDetails' } },
            { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'productDetails' } },
            { $match: categoryFilter },
            { $count: "total" }
        ]);

        const variants = await Variant.aggregate([
            { $lookup: { from: 'categories', localField: 'categoryName', foreignField: 'name', as: 'categoryDetails' } },
            { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'productDetails' } },
            { $match: categoryFilter },
            { $sort: sortOptions },
            { $skip: startIndex },
            { $limit: limit }
        ]);

        const totalCount = totalVariants.length > 0 ? totalVariants[0].total : 0;

        res.render("users/shopList", {
            variants,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            limit: limit,
            selectedCategory: category,
            sortBy: sortBy,
            searchQuery: searchQuery
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
        next(error);
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
        const otherVariants = await Variant.find({ productId, is_Delete: false });

        const colors = [variant.colour];
        const sizes = variant.size;

        res.render("users/productDetail", { variant, stockWithStatus, colors, sizes, otherVariants });
    } catch (error) {
        console.log(error.message);
        error.status = 500;
        next(error);
    }
};







