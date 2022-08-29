import express from 'express';
import { router as tagsRouter } from '@routes/tags';
import { requireTaskUuid } from "@middleware/requireTaskUuid";
import { requireTaskName } from "@middleware/requireTaskName";
import { loadAuthenticatedUser, requireAccessToken } from '@middleware/auth';
import createError from "http-errors";

const router = express.Router();

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);
router.use('/tags', tagsRouter);

function requireTaskUuid(req, res, next) {
  if (!req.body) return next(createError(StatusCodes.BAD_REQUEST, 'Request body is falsy'));
  if (!req.body.uuid) return next(createError(StatusCodes.BAD_REQUEST, 'No UUID provided'));
  if (!isValidUUID(req.body.uuid)) return next(createError(StatusCodes.BAD_REQUEST, 'Invalid UUID'));
  if (req.task && typeof req.task !== 'object') {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR,`Already assigned unexpected type ${typeof req.task}`));
  }

  if (!req.task) req.task = {};
  req.task.uuid = req.body.uuid;

  next();
}

function requireTaskName(req, res, next) {
  if (!req.body) return next(createError(StatusCodes.BAD_REQUEST, 'Request body is falsy'));
  if (!req.body.name) return next(createError(StatusCodes.BAD_REQUEST, 'No name provided'));
  if (typeof req.body.name !== 'string') return next(createError(StatusCodes.BAD_REQUEST, 'Name is not a string'));
  if (req.task && typeof req.task !== 'object') {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR,`Already assigned unexpected type ${typeof req.task}`));
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

  res.status(StatusCodes.CREATED).send({ uuid: task.uuid });
});

/* Update user task. */
router.post('/update', requireTaskUuid, function (req, res, next) {
  if (!req.body)  return next(createError(StatusCodes.BAD_REQUEST,'Request body is falsy'));

  // @ts-ignore TODO
  const task = new Task(req.task.uuid);

  if (req.body.name && typeof req.body.name === 'string') task.name = req.body.name;
  if (req.body.isDone && typeof req.body.isDone === 'boolean') task.isDone = req.body.isDone;
  if (req.body.content && typeof req.body.content === 'string') task.content = req.body.content;

  res.sendStatus(StatusCodes.OK);
});

/* DELETE user task. */
router.delete('/:uuid', function (req, res, next) {
  if (!req.params.uuid) return next(createError(StatusCodes.BAD_REQUEST,'No UUID provided'));
  if (!isValidUUID(req.params.uuid)) return next(createError(StatusCodes.BAD_REQUEST, 'Invalid UUID'));
  // @ts-ignore TODO
  new Task(req.params.uuid).delete();

  res.sendStatus(StatusCodes.OK);
});

export { router };
