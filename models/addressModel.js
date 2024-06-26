const mongoose = require("mongoose")

const addressSchema = new mongoose.Schema({

    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "userData",
        required : true
    },

        name:{
            type:String,
            required:true
        },
        mobile:{
            type:Number,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        postOffice:{
            type:String,
            required:true
        },
        landMark:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        }
    

});

module.exports = mongoose.model("Address", addressSchema);