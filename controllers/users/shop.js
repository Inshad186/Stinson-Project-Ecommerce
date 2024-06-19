const Product = require("../../models/productModel")
const Variant = require("../../models/varientModel")
const mongoose = require('mongoose');

exports.viewshopList = async(req,res)=>{
    try {
        const products = await Product.find({is_Delete : false})
        console.log("-------------------------------------------- My Products",products);
        res.render("users/shopList", {products})
    } catch (error) {
       console.log(error.message); 
    }
}



exports.productDetail = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Product.findById(productId);
        const variants = await Variant.find({ productId });


        const isOutOfStock = variants.some(variant => {
            return variant.stock.some(stockItem => stockItem <= 0);
        });
        

        console.log("------------ find by id product ", product);
        console.log("------------ variants ", variants);
        console.log("-------------this is my stock", isOutOfStock);

        res.render("users/productDetail", { product, variants, isOutOfStock });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
};





