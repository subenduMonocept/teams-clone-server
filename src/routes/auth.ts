import express from "express";
import {
  signup,
  login,
  deleteUser,
  updateUser,
  getAllUsers,
} from "../controller/authController";

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.delete("/delete-user", deleteUser);

router.put("/update-user", updateUser);

router.get("/get-all-users", getAllUsers);

export default router;
