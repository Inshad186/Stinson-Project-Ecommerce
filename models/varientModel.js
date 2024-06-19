const mongoose = require("mongoose")

const varientSchema = new mongoose.Schema({

    size:{
        type:[String],
        required:true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true  
    },
    salePrice:{
        type:Number,
        required:true
    },
    stock:{
        type:[Number],
        required:true
    },
    colour:{
        type:String,
        required:true
    },
    image:{
        type:[String],
        required:true
    },
    is_Delete: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("Varients",varientSchema)