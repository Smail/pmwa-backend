import express from "express";
import { StatusCodes } from "http-status-codes";
import { loadAuthenticatedUser, requireAccessToken } from "@middleware/auth";
import { Task } from "@models/Task";
import { Tag } from "@models/Tag";

const router = express.Router({ mergeParams: true });

router.use(requireAccessToken);
router.use(loadAuthenticatedUser);

/* GET all available tag names. */
router.get("/names", function (req, res, next) {
  res.status(StatusCodes.OK).send(Tag.getAllTagNames());
});

/* GET task's tags. */
router.get("/:taskUuid", function (req, res, next) {
  res.status(StatusCodes.OK).send(new Task(req.params.taskUuid).tags);
});

/* GET UUIDs of tasks, that are tagged with the specified tag name. */
router.get("/has/name/:tagName", function (req, res, next) {
  res.status(StatusCodes.OK).send(Task.withTagName(req.params.tagName));
});

/* GET UUIDs of tasks, that are tagged with the specified tag name. */
router.get("/has/id/:tagUuid", function (req, res, next) {
  res.status(StatusCodes.OK).send(Task.withTagUUID(req.params.tagUuid));
});

export { router };
