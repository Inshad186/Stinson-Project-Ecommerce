const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({

     couponName: {
      type:String,
      required:true,
      trim:true
     },
     couponCode: {
        type:String,
        required:true
     },
     discountPercentage: {
        type:Number,
        required:true
     },
     minPurchaseAmount: {
        type:Number,
        required:true
     },
     maxRedeemAmount: {
        type:Number,
        required:true
     },
     expiryDate: {
        type:Date,
        required:true
     },
     listed: {
      type:Boolean,
      required:true,
      default:true
     },
    },
    
    { timestamps: true })
  
module.exports = mongoose.model('Coupons',couponSchema)