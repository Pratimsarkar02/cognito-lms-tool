// userController.js — complete rewrite
// Adds: getAllUsers, getUserById, updateUserRole, deleteUser, updateOwnProfile
import userModel from '../models/userModel.js';
import bcrypt from 'bcryptjs';

// ─── GET OWN PROFILE ─────────────────────────────────────────────────────────
// GET /api/user/data  (all roles — existing route, unchanged response shape)
export const getUserData = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).lean();
    if (!user) return res.json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      userData: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── UPDATE OWN PROFILE ───────────────────────────────────────────────────────
// PATCH /api/user/profile  (all roles — update own name only; email is read-only)
export const updateOwnProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.json({ success: false, message: 'First name and last name are required.' });
    }

    const updated = await userModel.findByIdAndUpdate(
      req.user.id,
      { firstName: firstName.trim(), lastName: lastName.trim() },
      { new: true, select: '-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt' }
    ).lean();

    res.json({ success: true, message: 'Profile updated successfully.', userData: updated });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── GET ALL USERS (Admin only) ───────────────────────────────────────────────
// GET /api/user/all?role=&search=&page=&limit=
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && ['Student', 'Faculty', 'Admin'].includes(role)) {
      query.role = role;
    }

    if (search?.trim()) {
      const s = search.trim();
      query.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName:  { $regex: s, $options: 'i' } },
        { email:     { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      userModel
        .find(query)
        .select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      userModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE USER BY ID (Admin only) ──────────────────────────────────────
// GET /api/user/:userId
export const getUserById = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.userId)
      .select('-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt')
      .lean();

    if (!user) return res.json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── UPDATE USER ROLE (Admin only) ───────────────────────────────────────────
// PATCH /api/user/:userId/role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Student', 'Faculty', 'Admin'].includes(role)) {
      return res.json({ success: false, message: 'Invalid role. Must be Student, Faculty, or Admin.' });
    }

    // Prevent admin from demoting themselves
    if (req.params.userId === req.user.id.toString()) {
      return res.json({ success: false, message: 'You cannot change your own role.' });
    }

    const updated = await userModel.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true, select: '-password -verifyOtp -verifyOtpExpireAt -resetOtp -resetOtpExpireAt' }
    ).lean();

    if (!updated) return res.json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `Role updated to ${role}.`, user: updated });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── DELETE USER (Admin only) ─────────────────────────────────────────────────
// DELETE /api/user/:userId
export const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.userId === req.user.id.toString()) {
      return res.json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await userModel.findByIdAndDelete(req.params.userId);
    if (!user) return res.json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: `User "${user.firstName} ${user.lastName}" deleted successfully.` });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};