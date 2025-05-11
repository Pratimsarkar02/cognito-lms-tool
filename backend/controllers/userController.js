import userModel from "../models/userModel.js";


export const getUserData = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        
        //If user not found
        if (!user) {
            return res.json({success: false, message: "User not found"});
        }
        //Fetching user data
        res.json({
            success: true,
            userData: {
                firstName: user.firstName,
                lastName: user.lastName,
                isAccountVerified: user.isAccountVerified,
                email: user.email,
                role: user.role

            }
        });

    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

