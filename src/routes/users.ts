import express from 'express';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import * as Model from 'Model';
import { NetworkError } from '@utils/errors/NetworkError';
import { requireAccessToken } from './auth';

const router = express.Router();

/* GET user */
router.get('/username/:username', requireAccessToken, function (req, res, next) {
  // @ts-ignore TODO
  const tokenContent = req.accessTokenContent;

  if (!(tokenContent.username === req.params.username || tokenContent.userLevel === 'admin')) {
    throw new NetworkError(ReasonPhrases.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  res.send(Model.getUserFromUsername(tokenContent.username)?.toString()); // TODO this is weird code? toString doesnt exists TODO (...)?.username
});

/* GET usernames */
router.get('/usernames', requireAccessToken, function (req, res, next) {
  // @ts-ignore TODO
  const tokenContent = req.accessTokenContent;

  if (tokenContent.userLevel !== 'admin') {
    throw new NetworkError(ReasonPhrases.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  res.send(JSON.stringify(Model.users.map(user => user.username)));
});

router.get('/:username/display-name', requireAccessToken, function (req, res, next) {
  // @ts-ignore TODO
  const tokenContent = req.accessTokenContent;

  if (tokenContent.username !== req.params.username) {
    // TODO log errors in node console output / file
    throw new NetworkError(ReasonPhrases.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  res.send({ displayName: Model.getUserFromUsername(tokenContent.username)?.displayName }); // TODO null coalescing
});

export { router };
