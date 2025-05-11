import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

// Register a new user
export const register = async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    //Checking if all the fields are filled
    if (!firstName || !lastName || !email || !password || !role) {
        return res.json({success: false, message: "Please fill all the fields"});
    }
    //Checking if the email is valid
    try {
        const existingUser = await userModel.findOne({email});

        if (existingUser) {
            return res.json({success: false, message: "User already exists"});
        }
        //Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);
        //Creating a new user
        const users = new userModel({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role
        });
        //Saving the user
        await users.save();
        //Creating a token
        const token = jwt.sign({email: users.email, id: users._id}, process.env.JWT_SECRET_KEY, {algorithm: 'HS256', expiresIn: '7d'});
        //Sending the token in a cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        //sending Welcome message upon user signing up 
        const mailOptions = {
            from: process.env.SENDER_MAIL,
            to: email,
            subject: "Welcome to COGNITO - Your Journey Starts Here!",
            html: `        
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h1 style="text-align: center; color: #4CAF50;">🎉 Welcome to COGNITO!</h1>
          <p>Hi <strong>${firstName}</strong>,</p>
          <p>We are thrilled to have you on board! 🚀 At <strong>COGNITO</strong>, we strive to empower learners like you with tools, resources, and a supportive community to help you achieve your goals.</p>
          <p>Here are your Login Credentials: </p>
            <ul>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Password:</strong> ${password}</li>
            </ul>
          <p>Please make sure to keep your credentials safe and noted somewhere to ensure using COGNITO smooth and hassle-free.</p>
          <p>Here is what you can do next to get started:</p>
          <ol>
            <li><strong>Complete Your Profile</strong>: Make the most of your experience by updating your profile <a href="#">here</a>.</li>
            <li><strong>Explore Our Features</strong>: From personalized dashboards to insightful analytics, we've got you covered.</li>
            <li><strong>Stay Connected</strong>: Join our active forums and connect with like-minded peers.</li>
          </ol>
          <a href="#" style="display: inline-block; margin: 20px 0; padding: 10px 20px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Explore COGNITO Now</a>
          <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:help.cognito@gmail.com">help.cognito@gmail.com</a>.</p>
          <p>Let's make great things happen together!</p>
          <p>Best regards,</p>
          <p>The <strong>COGNITO Team</strong></p>
          <hr />
          <p style="font-size: 0.9em; text-align: center; color: #555;">Follow us on <a href="#">LinkedIn</a> | <a href="#">Twitter</a> | <a href="#">Facebook</a></p>
          <p style="font-size: 0.9em; text-align: center; color: #999;">© 2025 COGNITO. All Rights Reserved.</p>
        </div>
        `
        }

        await transporter.sendMail(mailOptions);


        return res.status(200).json({success: true, message: "User Signed Up Successfully"});

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}
// Login a user
export const login = async (req, res) => {
    const { email, password } = req.body;

    //Checking if all the fields are filled
    if (!email || !password) {
        return res.json({success: false, message: "Email and password are required"});
    }
    //Checking if the email is valid
    try {
        const user = await userModel.findOne({email}).select('firstName lastName email role password isAccountVerified');

        if (!user) {
            return res.json({success: false, message: "Invalid Email"});
        }
        //Checking if the password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.json({success: false, message: "Invalid Password"});
        }
        //Taking id, email and role to create jwt token
        const token = jwt.sign({email: user.email, id: user._id, role: user.role}, process.env.JWT_SECRET_KEY, {algorithm:'HS256', expiresIn: '7d'});
        //Sending the token in a cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true, 
            message: "User Logged In Successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isAccountVerified: user.isAccountVerified
            }
        });

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}
// Logout a user
export const logout = (req, res) => {
    //Clearing the cookie
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({success: true, message: "Logged Out Successfully"});
        
    } catch (error) {
        res.json({success: false, message: error.message});
        
    }
}
// Send OTP for verification
export const sendVerifyOtp = async (req, res) => {
    try {
        
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        
        if(!user){
            return res.status(404).json({
                success: false, 
                message: "User not found"}
            );
        }
        //Checking if acccount is already verified
        if(user.isAccountVerified){
            return res.json({success: false, message: "Account is already verified"});
        }
        
        //Generating OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        
        //Saving the OTP and its expiry time
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        
        //Saving the user
        await user.save();

        //Sending the OTP in Email
        const mailOptions = {
            from: process.env.SENDER_MAIL,
            to: user.email,
            subject: "Verify Your Email Address",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h1 style="text-align: center; color: #4CAF50;">Verify Your Email Address</h1>
            <p>Hi <strong>${user.firstName}</strong>,</p>
            <p>Thank you for signing up with COGNITO! 🚀</p>
            <p>Here is your OTP to verify your email address: <strong>${otp}</strong></p>
            <p>Please enter this OTP in the verification field to complete the verification process.</p>
            <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:help.cognito@gmail.com">help.cognito@gmail.com</a>.</p>
            <p>Best regards,</p>
            <p>The <strong>COGNITO Team</strong></p>
            <hr />
            <p style="font-size: 0.9em; text-align: center; color: #555;">Follow us on <a href="#">LinkedIn</a> | <a href="#">Twitter</a> | <a href="#">Facebook</a></p>
            <p style="font-size: 0.9em; text-align: center; color: #999;">© 2025 COGNITO. All Rights Reserved.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: "OTP sent successfully"});

    } catch (error) {
        res.json({success: false, message: error.message});        
    }
}
// Verify Email using OTP
export const verifyEmail = async (req, res) => {
    const userId = req.user.id;
    const {otp} = req.body;
    //Checking if all the fields are filled
    if (!userId || !otp) {
        return res.json({success: false, message: "Please provide userId and email"});
    }
    try {
        
        const user = await userModel.findById(userId);

        if(!user){
            return res.json({success: false, message: "User not found"});
        }
        //Checking if OTP is valid
        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.json({success: false, message: "Invalid OTP"});
        }
        //Checking if OTP is expired
        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP Expired"});
        }
        //Setting the account as verified
        user.isAccountVerified = true;
        //Clearing the OTP and its expiry time
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({
            success: true, 
            message: "Account Verified Successfully",
            user: {
                id:user._id,
                role: user.role
            }
        });

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}
// Check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({success: true, message: "User is authenticated"});

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}
// Send OTP to reset password
export const sendResetOtp = async (req, res) => {
    const {email} = req.body;
    //CHecking if email is provided
    if(!email){
        return res.json({success: false, message: "Please provide your email"});
    }
    try {
        const user = await userModel.findOne({email});
        //Checking if user exists
        if(!user){
            return res.json({success: false, message: "User not found"});
        }
        //Generating OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        
        //Saving the OTP and its expiry time
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
        
        //Saving the user
        await user.save();

        //Sending the OTP in Email
        const mailOptions = {
            from: process.env.SENDER_MAIL,
            to: user.email,
            subject: "Reset Your Password",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h1 style="text-align: center; color: #4CAF50;">Reset Your Password</h1>
            <p>Hi <strong>${user.firstName}</strong>,</p>
            <p>We received a request to reset your password. Please use the following OTP to reset your password.</p>
            <p>Here is your OTP: <strong>${otp}</strong></p>
            <p>Please enter this OTP in the reset password field to complete the process.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:help.cognito@gmail.com">help.cognito@gmail.com</a>.</p>
            <p>Best regards,</p>
            <p>The <strong>COGNITO Team</strong></p>
            <hr />
            <p style="font-size: 0.9em; text-align: center; color: #555;">Follow us on <a href="#">LinkedIn</a> | <a href="#">Twitter</a> | <a href="#">Facebook</a></p>
            <p style="font-size: 0.9em; text-align: center; color: #999;">© 2025 COGNITO. All Rights Reserved.</p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: "OTP sent successfully"});

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}
// Reset Password using OTP
export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;
    //Checking if all the fields are filled
    if(!email || !otp || !newPassword){
        return res.json({success: false, message: "Please provide email, OTP and new password"});
    }
    try {
        const user = await userModel.findOne({email});
        //Checking if user exists
        if(!user){
            return res.json({success: false, message: "User not found"});
        }
        //Checking if OTP is valid
        if(user.resetOtp === '' || user.resetOtp !== otp){
            return res.json({success: false, message: "Invalid OTP"});
        }
        //Checking if OTP is expired
        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP Expired"});
        }
        //Hashing the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        //Setting the new password
        user.password = hashedPassword;

        //Clearing the OTP and its expiry time
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({success: true, message: "Password has been reset successfully"});


    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}
//OTP Verification
// Verify reset password OTP
export const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.json({ success: false, message: "Please provide email and OTP" });
    }
    
    try {
        const user = await userModel.findOne({ email });
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        
        // Check if OTP is valid
        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }
        
        // Check if OTP is expired
        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP has expired" });
        }
        
        return res.json({ success: true, message: "OTP verified successfully" });
        
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};