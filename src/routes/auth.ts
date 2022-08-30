import express from "express";
import { refresh_token, sign_in_user } from "@controllers/authController";

const router = express.Router();

router.post("/signin", sign_in_user);

// Issue new access and refresh token with a provided refresh token.
router.post("/refresh-token", refresh_token);

export { router };
