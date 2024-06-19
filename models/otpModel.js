const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({

    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    CreatedAt:{
        type:Date,
        default:Date.now(),
        expires:120
    }
});

module.exports = mongoose.model("Otps",otpSchema);