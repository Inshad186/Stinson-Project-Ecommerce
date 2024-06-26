const Product = require("../../models/productModel")
const Variant = require("../../models/varientModel")

exports.viewshopList = async(req,res)=>{
    try {
        const products = await Product.find({is_Delete : false})
        const variants = await Variant.find({})
        res.render("users/shopList", {products , variants})
    } catch (error) {
       console.log(error.message); 
    }
}




exports.productDetail = async (req, res) => {
    try {
        const variantId = req.query.id;
        const variant = await Variant.findOne({ _id: variantId });

        if (!variant) {
            return res.status(404).send("Variant not found");
        }

        // Assuming 'stock' is an array of numbers representing stock levels
        const stockStatus = variant.stock.some(stock => stock > 0) ? 'In stock' : 'Out of stock';

        const productId = variant.productId;
        const otherVariants = await Variant.find({ productId });

        const colors = [variant.colour];
        const sizes = variant.size;

        res.render("users/productDetail", { variant, stockStatus, colors, sizes, otherVariants });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};







