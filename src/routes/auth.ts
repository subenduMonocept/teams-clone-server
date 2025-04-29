import express from "express";
import {
  signup,
  login,
  deleteUser,
  updateUser,
  getAllUsers,
  refreshToken,
  logout,
} from "../controller/authController";
import { loginLimiter, apiLimiter } from "../middleware/rateLimiter";
import {
  validateSignup,
  validateLogin,
  validateUpdateUser,
  validateRequest,
} from "../middleware/validator";

const router = express.Router();

router.post("/signup", apiLimiter, validateSignup, validateRequest, signup);

router.post("/login", loginLimiter, validateLogin, validateRequest, login);

router.post("/refresh-token", apiLimiter, refreshToken);

router.post("/logout", apiLimiter, logout);

router.delete("/delete-user", apiLimiter, deleteUser);

router.put(
  "/update-user",
  apiLimiter,
  validateUpdateUser,
  validateRequest,
  updateUser
);

router.get("/get-all-users", apiLimiter, getAllUsers);

export default router;
