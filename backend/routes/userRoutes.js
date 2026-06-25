// userRoutes.js — complete rewrite
import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { isAdmin } from '../middleware/roleMiddleware.js';
import {
  getUserData,
  updateOwnProfile,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';

const userRouter = express.Router();

// ── All authenticated users ───────────────────────────────────────────────────
userRouter.get('/data', userAuth, getUserData);
userRouter.patch('/profile', userAuth, updateOwnProfile);

// ── Admin only ────────────────────────────────────────────────────────────────
// ORDER: /all before /:userId to prevent "all" being treated as an ID
userRouter.get('/all', userAuth, isAdmin, getAllUsers);
userRouter.get('/:userId', userAuth, isAdmin, getUserById);
userRouter.patch('/:userId/role', userAuth, isAdmin, updateUserRole);
userRouter.delete('/:userId', userAuth, isAdmin, deleteUser);

export default userRouter;