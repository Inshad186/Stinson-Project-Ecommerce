const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({

    offerName: {
        type: String,
        required: true
    },
    offerType: {
        type: String,
        enum: ['Category Offer', 'Product Offer'],
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    listed: {
        type: Boolean,
        default: true
    },
    expiryDate: {
        type: String,
        required: true
    },
    productId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
    },
    categoryId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    appliedItem: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('Offers', offerSchema);