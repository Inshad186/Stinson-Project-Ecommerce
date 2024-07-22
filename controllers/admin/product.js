const Product = require("../../models/productModel");
const Categories = require('../../models/categoryModel')
const Variants = require("../../models/varientModel")


exports.addProduct = async (req, res) => {
    try {
        const categories = await Categories.find({});
        res.render("admin/addProduct", { categories });
    } catch (error) {
        console.log(error.message);
    }
};


exports.insertProduct = async (req, res) => {
    try {
        const { name, description, size, orginalPrice, discount, categoryId, brand } = req.body;

        if (!categoryId) {
            return res.status(400).json({ success: false, message: 'Category ID is required' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image file is required' });
        }

        const image = `/admin/uploads/category/${req.file.filename}`;

        const insertProduct = new Product({
            name,
            description,
            brand,
            size: Array.isArray(size) ? size : [size],
            orginalPrice: parseFloat(orginalPrice),
            discount: parseFloat(discount),
            categoryId,
            image
        });

        const saveProduct = await insertProduct.save();

        res.status(200).json({ success: true, productId: saveProduct._id });
    } catch (error) {

        res.status(500).json({ success: false, message: error.message });
    }
};



exports.productList = async (req, res) => {
    try {

        const products = await Product.find().populate('categoryId');
        const showPagination = products.length;
        res.render("admin/productList", { products,showPagination });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};



exports.viewEditProduct = async(req,res)=>{
    try {
        const productId = req.params.productId;
        const productToEdit = await Product.findById(productId);
        res.render("admin/editProduct",{productToEdit});
    } catch (error) {
        console.log(error.message);
    }
}



exports.editProduct = async(req,res)=>{
    try {
        const productId = req.params.productId
        const oldProduct = await Product.findById(productId)

        if (!oldProduct) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const { name, description } = req.body;
        const updateData = {};
        let isUpdated = false;

        if (name && name.trim() !== '') {
            const trimmedName = name.trim();
            if (trimmedName.toLowerCase() !== oldProduct.name.toLowerCase()) {
                const existingProduct = await category.findOne({ name: new RegExp(`^${trimmedName}$`, 'i') });
                if (existingProduct && existingProduct._id.toString() !== productId) {
                    return res.status(400).json({ success: false, message: "A product with this name already exists." });
                } else {
                    updateData.name = trimmedName;
                    isUpdated = true;
                }
            }
        }

        if (description && description.trim() !== oldProduct.description.trim()) {
            updateData.description = description.trim();
            isUpdated = true;
        }

        if (req.file) {
            const image = `/admin/uploads/category/${req.file.filename}`;
            updateData.image = image;
            isUpdated = true;
        }

        if (!isUpdated) {
            return res.status(400).json({ success: false, message: "You need to update at least one field." });
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, { $set: updateData }, { new: true });

        res.json({ success: true, category: updatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



exports.deleteProduct = async(req,res)=>{
    try {
        const product = await Product.findOne({_id: req.body.productId});

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        product.is_Delete = !product.is_Delete;
        const saveData = await product.save();
        res.status(200).json({ success: true, productState: saveData.is_Delete });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}



exports.viewProductDetails = async(req, res) => {
    try {
        const productId = req.query.id;

        const variantDetails = await Variants.find({ productId:productId });
        const productDetails = await Product.findById(productId);

        res.render("admin/productDetail", { variantDetails: variantDetails,productDetails: productDetails,productId:productId });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}



