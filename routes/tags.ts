import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { requireAccessToken, loadAuthenticatedUser } from './auth';
import { Task } from "../src/Task";

const router = express.Router({ mergeParams: true });

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);

/* GET task's tags. */
router.get('/:taskUuid', function (req, res, next) {
  res.status(StatusCodes.OK).send(new Task(req.params.taskUuid).tags);
});

export { router };
