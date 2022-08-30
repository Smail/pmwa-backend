import express from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { checkUsername } from "@middleware/checkUsername";
import { requireAccessToken } from '@middleware/auth';
import createError from "http-errors";
import { get_display_name, get_user } from "@controllers/usersController";

const router = express.Router();

/* GET user */
router.get('/username/:username', requireAccessToken, checkUsername, get_user);

router.get('/:username/display-name', requireAccessToken, checkUsername, get_display_name);

export { router };
