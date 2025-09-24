import { Router } from "express";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post("/register", authController.register);
router.get("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);

export default router;