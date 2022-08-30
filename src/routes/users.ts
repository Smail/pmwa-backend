import express from 'express';
import { requireAccessToken } from '@middleware/auth';
import { checkUsername } from "@middleware/checkUsername";
import { create_user } from "@controllers/authController";
import { get_display_name, get_user } from "@controllers/usersController";

const router = express.Router();

/* GET user */
router.get('/username/:username', requireAccessToken, checkUsername, get_user);

/* CREATE user */
router.post('/', create_user);

router.get('/:username/display-name', requireAccessToken, checkUsername, get_display_name);

export { router };
