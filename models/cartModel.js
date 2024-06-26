const mongoose = require("mongoose")

const cartModel = new mongoose.Schema({

    userId :{
        type  : mongoose.Schema.Types.ObjectId,
        ref   : 'User',
        required : true
    },

    products :[{
        productVariantId : {
            type  : mongoose.Schema.Types.ObjectId,
            ref   : 'Varients',
            required : true
        },

        quantity :{
            type : Number,
            default : 1
        }
    }]

    },
    {timestamps:true})


module.exports = mongoose.model("Cart",cartModel)