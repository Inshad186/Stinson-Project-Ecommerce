const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    userId : {
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    orderItems: [{
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Variants',
            required: true
        },
        variantName:{
            type:String,
            required:true
        },
        variantPrice:{
            type:Number,
            required:true
        },
        quantity: {
            type: Number,
            required: true
        },
        orderStatus: {
            type: String,
            default: 'Processing',
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Completed', 'Return requested', 'Return approved', 'Return Rejected', 'Refunded'],
        },
        returnReason: { 
            type: String
        }
    }],
    offerDiscount: {
        type: Number
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    deliveryDate: {
        type: Date,
        default: null
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        default: 'Failed',
        enum: ['Pending', 'Success', 'Failed']
    },
    subTotal: {
        type: Number,
        required: true
    },
    deliveryCharge: {
        type: String,
    },
    grandTotal: {
        type: Number,
        required: true
    },
    shippingAddress: {
        name: {
            type: String,
            required: true
        },

        altPhone: {
            type: Number,
            required: true
        },

        pinCode: {
            type: Number,
            required: true
        },

        city: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        },

        landmark: {
            type: String,
            required: true
        },

        postoffice: {
            type: String,
            required: true
        },
    },

    couponDetails: {
        discountPercentage: {
            type: Number
        },
        claimedAmount: {
            type: Number
        },
        couponCode: {
            type: String
        },
        minPurchaseAmount: {
            type: Number
        },
        maxDiscountAmount: {
            type: Number
        },
    }

}, {timestamps: true});

module.exports = mongoose.model('Order',orderSchema);