import express from "express";
import { StatusCodes } from "http-status-codes";
import { TaskDepreciated } from "@models/Task.depreciated";
import { TagDepreciated } from "@models/Tag.depreciated";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { requireAuthenticatedUser } from "@middleware/requireAuthenticatedUser";

const router = express.Router({ mergeParams: true });

router.use(requireAccessToken);
router.use(requireAuthenticatedUser);

/* GET all available tag names. */
router.get("/names", function (req, res, next) {
  res.status(StatusCodes.OK).send(TagDepreciated.getAllTagNames());
});

/* GET task's tags. */
router.get("/:taskUuid", function (req, res, next) {
  res.status(StatusCodes.OK).send(new TaskDepreciated(req.params.taskUuid).tags);
});

/* GET UUIDs of tasks, that are tagged with the specified tag name. */
router.get("/has/name/:tagName", function (req, res, next) {
  res.status(StatusCodes.OK).send(TaskDepreciated.withTagName(req.params.tagName));
});

/* GET UUIDs of tasks, that are tagged with the specified tag name. */
router.get("/has/id/:tagUuid", function (req, res, next) {
  res.status(StatusCodes.OK).send(TaskDepreciated.withTagUUID(req.params.tagUuid));
});

export { router };
