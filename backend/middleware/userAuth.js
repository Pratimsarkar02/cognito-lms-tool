import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized - No token provided" 
    });
  }

  try {
    // Verify JWT
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY, {
      algorithms: ["HS256"]
    });

    // Check if user exists in DB
    const user = await userModel.findById(decodeToken.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found"
      });
    }

    req.user = {
      id: user._id, // Using DB _id instead of token payload
      _id: user._id,
      role: user.role,
      isVerified: user.isAccountVerified,
      email: user.email,
      firstName: user.firstName
    };

    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: `Authentication failed: ${error.message}` 
    });
  }
};

export default userAuth;