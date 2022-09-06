import express from "express";
import { refresh_token, sign_in_user, sign_up_user } from "@controllers/auth.controller";
import { requireUuidInBody } from "@middleware/requireUuidInBody";

const router = express.Router();

/* GET authenticated user */
router.post("/sign-in", sign_in_user);

/* POST new user */
router.post("/sign-up", sign_up_user);

// Issue new access and refresh token with a provided refresh token.
router.post("/refresh-token", requireUuidInBody, refresh_token);

export { router };
