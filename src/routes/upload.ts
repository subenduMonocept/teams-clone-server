import express from "express";
import { authenticate } from "../middleware/auth";
import { upload, handleFileUpload } from "../controller/uploadController";

const router = express.Router();

router.post("/", authenticate, upload.single("file"), handleFileUpload);

export default router;
