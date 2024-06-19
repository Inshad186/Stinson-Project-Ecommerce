const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    is_Admin:{
        type:Boolean,
        default:false
    },
    is_Verified:{
        type:Boolean,
        default:false
    },
    is_Block:{
        type:Boolean,
        default:false
    },
    CreatedAt:{
        type:Date,
        default:Date.now()
    }

})

module.exports = mongoose.model("User",userSchema);