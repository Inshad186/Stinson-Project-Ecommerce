const Variants = require('../../models/varientModel');
const Product = require('../../models/productModel');
const Category = require("../../models/categoryModel")

exports.loadvarients = async (req, res) => {
    try {
        const productId = req.params.productId;
        const productSize = await Product.findOne({ _id: productId }, { _id: 1, size: 1 });
        res.render('admin/addVariants', { productSize });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

exports.addVarients = async (req, res) => {
    try {
        const { colour, salePrice, sizes, stocks, productId } = req.body;

        // Fetch productName and categoryName based on productId
        const product = await Product.findById(productId).populate('categoryId', 'name');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const productName = product.name;  // Replace with the actual field name from Product model
        const categoryName = product.categoryId.name  // Replace with the actual field name from Product model

        const sizesArray = Array.isArray(sizes) ? sizes : [sizes];
        const stocksArray = Array.isArray(stocks) ? stocks.map(stock => parseInt(stock, 10)) : [parseInt(stocks, 10)];

        if (sizesArray.length !== stocksArray.length) {
            return res.status(400).json({ success: false, message: 'Sizes and stocks length mismatch' });
        }

        if (!productId) {
            return res.status(400).json({ success: false, message: 'product ID is required' });
        }

        if (!req.files || req.files.length < 3 || req.files.length > 6) {
            return res.status(400).json({ success: false, message: 'Please upload a minimum of 3 and a maximum of 6 images.' });
        }

        const imagePaths = req.files.map(file => `/admin/uploads/category/${file.filename}`);

        const newVariant = new Variants({
            productId,
            size: sizesArray,
            stock: stocksArray,
            colour,
            salePrice: parseFloat(salePrice),
            image: imagePaths,
            productName, 
            categoryName 
        });

        const savedVariant = await newVariant.save();

        res.status(200).json({ success: true, productId: savedVariant._id });
        
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};




exports.viewEditVariant = async(req,res)=>{
    try {
        const productId = req.params.productId;

        const variantToEdit = await Variants.findById(productId);

        res.render("admin/editVariant",{variantToEdit});
    } catch (error) {
        console.log(error.message);
    }
}


exports.editVariant = async (req, res) => {
    try {
        const productId = req.params.productId;
        const oldProduct = await Variants.findById(productId);

        const { sizes, salePrice, stocks, colour } = req.body;

        const parsedSizes = JSON.parse(sizes);
        const parsedStocks = JSON.parse(stocks);

        const updateData = {};
        let isUpdated = false;

        if (colour && colour.trim() !== oldProduct.colour.trim()) {
            updateData.colour = colour.trim();
            isUpdated = true;
        }

        if (parsedSizes && parsedSizes.join(',') !== oldProduct.size.join(',')) {
            updateData.size = parsedSizes;
            isUpdated = true;
        }

        if (salePrice && salePrice.trim() !== oldProduct.salePrice.toString()) {
            updateData.salePrice = salePrice.trim();
            isUpdated = true;
        }

        if (parsedStocks && parsedStocks.join(',') !== oldProduct.stock.join(',')) {
            updateData.stock = parsedStocks;
            isUpdated = true;
        }

        if (!isUpdated) {
            return res.status(400).json({ success: false, message: "You need to update at least one field." });
        }

        const updatedProduct = await Variants.findByIdAndUpdate(productId, { $set: updateData }, { new: true });

        res.json({ success: true, variant: updatedProduct });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

  


exports.deleteVariant = async(req,res)=>{
    try {
        const variant = await Variants.findOne({_id: req.body.variantId});

        if (!variant) {
            return res.status(404).json({ success: false, message: "variant not found" });
        }
        variant.is_Delete = !variant.is_Delete;
        const saveData = await variant.save();
        res.status(200).json({ success: true, variantState: saveData.is_Delete });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}





