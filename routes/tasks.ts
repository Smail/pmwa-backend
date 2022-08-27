import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { requireAccessToken, loadAuthenticatedUser } from './auth';
import { User } from "../src/User";
import { Task, TaskBuilder } from "../src/Task";
import { NetworkError } from "../src/NetworkError";
import { validate as isValidUUID } from 'uuid';

const router = express.Router();

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);

function requireTaskUuid(req, res, next) {
  if (!req.body) throw new NetworkError('Request body is falsy', StatusCodes.BAD_REQUEST);
  if (!req.body.uuid) throw new NetworkError('No UUID provided', StatusCodes.BAD_REQUEST);
  if (!isValidUUID(req.body.uuid)) throw new NetworkError('Invalid UUID', StatusCodes.BAD_REQUEST);
  if (req.task && typeof req.task !== 'object') {
    throw new NetworkError(`Task was assigned an unexpected type ${typeof req.task}`,
      StatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (!req.task) req.task = {};
  req.task.uuid = req.body.uuid;

  next();
}

function requireTaskName(req, res, next) {
  if (!req.body) throw new NetworkError('Request body is falsy', StatusCodes.BAD_REQUEST);
  if (!req.body.name) throw new NetworkError('No name provided', StatusCodes.BAD_REQUEST);
  if (typeof req.body.name !== 'string') throw new NetworkError('Name is not a string', StatusCodes.BAD_REQUEST);
  if (req.task && typeof req.task !== 'object') {
    throw new NetworkError(`Task was already assigned an unexpected type ${typeof req.task}`,
      StatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (!req.task) req.task = {};
  req.task.name = req.body.name;

  next();
}

/* GET user's tasks. */
router.get('/', function (req, res, next) {
  // @ts-ignore TODO
  const user: User = req.user;
  const tasks: Task[] = user.tasks;

  res.status(StatusCodes.OK).send(JSON.stringify(tasks));
});

/* POST Create new user task. */
router.post('/create', requireTaskName, function (req, res, next) {
  const task: Task = new TaskBuilder()
    // @ts-ignore TODO
    .addUserUuid(req.user.uuid)
    // @ts-ignore TODO
    .addName(req.task.name)
    // @ts-ignore TODO
    .addContent(req.task.content) // can be null
    .build();

  res.status(StatusCodes.CREATED).send({uuid: task.uuid});
});

/* Update user task. */
router.post('/update', requireTaskUuid, function (req, res, next) {
  if (!req.body) throw new NetworkError('Request body is falsy', StatusCodes.BAD_REQUEST);

  // @ts-ignore TODO
  const task = new Task(req.task.uuid);

  if (req.body.name && typeof req.body.name === 'string') task.name = req.body.name;
  if (req.body.isDone && typeof req.body.isDone === 'boolean') task.isDone = req.body.isDone;
  if (req.body.content && typeof req.body.content === 'string') task.content = req.body.content;

  res.sendStatus(StatusCodes.OK);
});

/* DELETE user task. */
router.delete('/:uuid', function (req, res, next) {
  if (!req.params.uuid) throw new NetworkError('No UUID provided', StatusCodes.BAD_REQUEST);
  if (!isValidUUID(req.params.uuid)) throw new NetworkError('Invalid UUID', StatusCodes.BAD_REQUEST);
  // @ts-ignore TODO
  new Task(req.params.uuid).delete();

  res.sendStatus(StatusCodes.OK);
});

export { router };
