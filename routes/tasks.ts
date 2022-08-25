import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { requireAccessToken, loadAuthenticatedUser } from './auth';

const router = express.Router();
router.use(requireAccessToken);
router.use(loadAuthenticatedUser);

/* GET user's tasks. */
router.get('/', function (req, res, next) {
  // @ts-ignore TODO
  res.status(StatusCodes.OK).send(JSON.stringify(req.user.tasks || []));
});

/* POST Create new user task. */
router.post('/', function (req, res, next) {
  // @ts-ignore TODO
  const user = req.user;
  const task = req.body;

  task.uuid = uuidv4();

  if (!user.tasks) user.tasks = [];
  user.tasks.push(task);

  res.status(StatusCodes.CREATED).send(task.uuid);
});

/* DELETE user task. */
router.delete('/:uuid', function (req, res, next) {
  // @ts-ignore TODO
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

export { router };
