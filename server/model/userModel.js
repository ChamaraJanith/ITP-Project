import { verify } from "jsonwebtoken";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true   // Optional, but usually good for emails
    },
    password:{
        type: String,
        required: true,
    },
    verifyOtp:{
        type:String,
        default:''
    },

    verifyOtpExpireAt:{
        type:Number,
        default:0
    },
    isAccountVerified:
    {
        type:Boolean,
        default:false
    },
    resetOtp:
    { 
        type:Boolean,
        default:''
    },
    resetOtpExpireAt:
    {
        type:Number,
        default:0
    },

    
});

// Create the User model from the schema
const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
