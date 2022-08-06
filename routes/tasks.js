const assert = require('assert');
const express = require('express');
const { StatusCodes } = require('http-status-codes');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
// Local modules
const { users, getUserFromUsername, existsUsername } = require('../src/app-model');
const { requireAccessToken, loadAuthenticatedUser } = require('./auth');

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);

/* GET user's tasks. */
router.get('/', function (req, res, next) {
  res.status(StatusCodes.OK).send(JSON.stringify(req.user.tasks || []));
});

/* POST Create new user task. */
router.post('/', function (req, res, next) {
  const user = req.user;
  const task = req.body;

  task.uuid = uuidv4();

  if (!user.tasks) user.tasks = [];
  user.tasks.push(task);

  res.status(StatusCodes.CREATED).send(task.uuid);
});

/* DELETE user task. */
router.delete('/:uuid', function (req, res, next) {
  const user = req.user;
  const uuid = req.params.uuid;

  if (!user.tasks) user.tasks = [];
  const idx = user.tasks.findIndex(task => task.uuid === uuid);
  if (idx > -1) {
    user.tasks.splice(idx, 1);
    res.sendStatus(StatusCodes.NO_CONTENT);
  } else {
    res.sendStatus(StatusCodes.NOT_FOUND);
  }
});

module.exports = { router };
