// ./controller/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../model/userModel.js";
import nodemailer from "nodemailer";
import 'dotenv/config';
import transporter from "../config/nodemailer.js";



export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please fill all the fields" });
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Send welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Hacked!!!!!!!!!!',
      text: `Your account was hacked by someone in US`
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

    transporter.verify(function(error, success) {
   if (error) console.error(error);
   else console.log('Server is ready to take messages');
});


  } catch (error) {
    console.error("Error in register:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/' // Must match original cookie path
    });

    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// Send verify ot[]

export const sendVerifyOtp = async (req,res) =>
{
  try{
    const {userID} = req.body;

    const user = await UserModel.findById(userID);

    if(user.isAccountVerified)
    {
      return res.json({success:false ,message: "Account Already verified" })
    }

    const otp = String( Math.floor(100000 + Math.random() *900000) );
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24*3600*1000

    await user.save();

    const mailOptioin  = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Welcome',
      text: `Your OTP os ${otp} . Verify your account usnig this OTP`
    }

    await transporter.sendMail(mailOptioin);

    res.json({success: true,message:`Verification OTP sent on Email`});



  }catch(error)
  {
    res.json({success: false,message:error.message});
  }
}

export const verifyEmail = async(req,res) =>
{
  const {userID , otp} = req.body;

  if(!userID || !otp)
  {
    return res.json({success: false,message:`Missing Details `});
  }

  try {
    const user = await UserModel.findById(userID);

    if(!user)
    {
      return res.json({success: false,message:`User Not found `});
    }

    if(user.verifyOtp === '' || user.verifyOtp !== otp)
    {
      return res.json({success: false,message:`Invalid Otp `});
    }

    if(user.verifyOtpExpireAt < Date.now())
    {
     return res.json({success: false,message:`Otp Expired `});
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;

    await user.save();
    return res.json({success: true,message:`Email Verified successfully`})

    



  } catch (error) {
    res.json({success: false,message:error.message});
  }

  
}
  //if user is authenticate
  export const isAuthenticated = async(req,res) =>
  {
    try {
      return res.json({success: true});
      
    } catch (error) {
      res.json({success: false,message:error.message});
    }
  }

  //send password reset otp
  export const sendResetOtp = async(req,res) =>
  {
    const {email} = req.body;

    if(!email)
    {
      return res.json({success:false,message:`Email is required`})
    }

    try {
      
      const user = await UserModel.findOne({email});
      if(!user)
      {
        return res.json({success:false,message:`User not found`});
      }

    const otp = String( Math.floor(100000 + Math.random() *900000) );
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 3*60*1000
    await user.save();

    const mailOptioin  = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Account verification OTP',
      text: `Reset OTP is ${otp}`
    }

    await transporter.sendMail(mailOptioin);

    return res.json({success:true,message:`OTP sent to your email`})

    } catch (error) {
      return res.json({success:false,message:error.message})
    }
  }

  //reset user password

  export const resetPassword = async(req,res) =>
  {
    const{email,otp,newPassword} = req.body;

    if(!email || !otp || !newPassword)
    {
      return res.json({success:false,message:`Email,OTP, and new password are required `});
    }

    try {

      const user= await UserModel.findOne({email});

      if(!user)
      {
         return res.json({success:false,message:`User not found`});

      }

      if(user.resetOtp === "" || user.resetOtp !==otp)
      {
        return res.json({success:false,message:` Invalid OTP`});
      }

      if(user.resetOtpExpireAt <Date.now())
      {
        return res.json({success:false,message:`OTP expired`});
      }

      const hashedPassword = await bcrypt.hash(newPassword,10);

      user.password = hashedPassword;
      user.resetOtp = '';
      user.resetOtpExpireAt = 0;

      await user.save();
      
      
    } catch (error) {
       return res.json({success:false,message:error.message})
    }
  }
