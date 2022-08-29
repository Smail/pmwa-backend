import express from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { requireAccessToken } from '@middleware/auth';
import createError from "http-errors";
import { get_display_name, get_user } from "@controllers/usersController";

const router = express.Router();

function checkUsername(req, res, next) {
  const tokenContent = req.accessTokenContent;

  if (!tokenContent.username) return next(createError(StatusCodes.BAD_REQUEST, 'No username in token'));
  if (tokenContent.username !== req.params.username) {
    return next(createError(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN));
  }
  next();
}

/* GET user */
router.get('/username/:username', requireAccessToken, checkUsername, get_user);

router.get('/:username/display-name', requireAccessToken, checkUsername, get_display_name);

export { router };
