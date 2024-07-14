const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    is_Active: {
        type: Boolean,
        default: true
    },
    is_Delete: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    offerDiscount: {
        type: Number
    }
});

module.exports = mongoose.model("Category", categorySchema);