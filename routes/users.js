const express = require('express');
const { ReasonPhrases, StatusCodes } = require('http-status-codes');
const router = express.Router();
// Local modules
const Model = require('../src/model');
const NetworkError = require('../src/NetworkError');
const { requireAccessToken } = require('./auth')

/* GET user */
router.get('/username/:username', requireAccessToken, function (req, res, next) {
  const tokenContent = req.accessTokenContent;

  if (!(tokenContent.username === req.params.username || tokenContent.userLevel === 'admin')) {
    throw new NetworkError(ReasonPhrases.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  res.send(Model.getUserFromUsername(tokenContent.username).toString()); // TODO this is weird code? toString doesnt exists
});

/* GET usernames */
router.get('/usernames', requireAccessToken, function (req, res, next) {
  const tokenContent = req.accessTokenContent;

  if (tokenContent.userLevel !== 'admin') {
    throw new NetworkError(ReasonPhrases.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  res.send(JSON.stringify(Model.users.map(user => user.username)));
});

/* GET dump all user data. */
router.get('/dump', requireAccessToken, function (req, res, next) {
  const tokenContent = req.accessTokenContent;

  if (tokenContent.userLevel !== 'admin') {
    throw new NetworkError(ReasonPhrases.FORBIDDEN, StatusCodes.FORBIDDEN);
  }

  res.send(JSON.stringify(Model.users.map(user => user.sensibleClone())));
});

module.exports = { router };
