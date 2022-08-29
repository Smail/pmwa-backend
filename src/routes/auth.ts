import express from 'express';
import { create_user, refresh_token, sign_in_user } from "@controllers/authController";

const router = express.Router();

// Create a new user
router.post('/signup', create_user);

router.post('/signin', sign_in_user);

// Issue new access and refresh token with a provided refresh token.
router.post('/refresh-token', refresh_token);

export { router };
