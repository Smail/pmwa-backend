import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { requireAccessToken, loadAuthenticatedUser } from './auth';
import { validate as isValidUUID } from 'uuid';
import { NetworkError } from "../src/NetworkError";

const router = express.Router({ mergeParams: true });

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);

/* GET task's tags. */
router.get('/:taskUuid', function (req, res, next) {
  const uuid = req.params.taskUuid;

  if (!isValidUUID(uuid)) throw new NetworkError('Invalid UUID', StatusCodes.BAD_REQUEST);

  // Mock

  res.status(StatusCodes.OK).send(
    [
      {
        name: 'FL Studio',
        color: 'yellow'
      },
      {
        name: 'School',
        color: 'red'
      },
      {
        name: 'Art',
        color: 'lime'
      },
    ]);
});

export { router };
