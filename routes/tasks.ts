import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { requireAccessToken, loadAuthenticatedUser } from './auth';
import { User } from "../src/User";
import { Task, TaskBuilder } from "../src/Task";
import { NetworkError } from "../src/NetworkError";

const router = express.Router();

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);

function requireTaskTaskUuid(req, res, next) {
  if (!req.body) throw new NetworkError('Request body is falsy', StatusCodes.BAD_REQUEST);
  if (!req.body.uuid) throw new NetworkError('No (task) UUID provided', StatusCodes.BAD_REQUEST);
  if (typeof req.body.uuid !== 'string') {
    throw new NetworkError('(task) UUID is not a string', StatusCodes.BAD_REQUEST);
  }
  if (req.task && typeof req.task !== 'object') {
    throw new NetworkError(`Task was assigned an unexpected type ${typeof req.task}`,
      StatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (!req.task) req.task = {};
  req.task.uuid = req.body.uuid;

  next();
}

function requireTaskContent(req, res, next) {
  if (!req.body) throw new NetworkError('Request body is falsy', StatusCodes.BAD_REQUEST);
  if (!req.body.content) throw new NetworkError('No content provided', StatusCodes.BAD_REQUEST);
  if (typeof req.body.content !== 'string') {
    throw new NetworkError('Content is not a string', StatusCodes.BAD_REQUEST);
  }
  if (req.task && typeof req.task !== 'object') {
    throw new NetworkError(`Task was assigned an unexpected type ${typeof req.task}`,
      StatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (!req.task) req.task = {};
  req.task.content = req.body.content;

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
router.post('/create', requireTaskContent, function (req, res, next) {
  const task: Task = new TaskBuilder()
    // @ts-ignore TODO
    .addUserUuid(req.user.uuid)
    // @ts-ignore TODO
    .addContent(req.task.content)
    .build();

  res.status(StatusCodes.CREATED).send({uuid: task.uuid});
});

/* Update Create new user task. */
router.post('/update', requireTaskTaskUuid, requireTaskContent, function (req, res, next) {
  // @ts-ignore TODO
  const task: Task = new Task(req.task.uuid);
  // @ts-ignore TODO
  task.content = (req.task.content);

  res.sendStatus(StatusCodes.OK);
});

/* DELETE user task. */
router.delete('/:uuid', function (req, res, next) {
  res.sendStatus(StatusCodes.NOT_IMPLEMENTED);
});

export { router };
