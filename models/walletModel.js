const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    amount:{
        type:Number,
        required:true
    },
    transactionMethod:{
        type: String,
        required: true,
        enum: ['Razorpay','Refund','Purchase','Referral','Cancelled']
    },
    date:{
        type:Date,
        default:Date.now
    }
});

const walletSchema = new mongoose.Schema({
    userId : {
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    transactions: [transactionSchema]
},{timestamps: true});

module.exports = mongoose.model('Wallet',walletSchema);