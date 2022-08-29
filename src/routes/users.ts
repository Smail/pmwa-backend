import express from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import * as Model from 'Model';
import { requireAccessToken } from '@middleware/auth';
import createError from "http-errors";

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
router.get('/username/:username', requireAccessToken, checkUsername, function (req, res, next) {
  // @ts-ignore TODO
  res.send(Model.getUserFromUsername(req.accessTokenContent.username)?.toString()); // TODO this is weird code? toString doesnt exists TODO (...)?.username
});

router.get('/:username/display-name', requireAccessToken, checkUsername, function (req, res, next) {
  // @ts-ignore TODO
  res.send({ displayName: Model.getUserFromUsername(req.accessTokenContent.username)?.displayName }); // TODO null coalescing
});

export { router };
