import express from "express";
import { StatusCodes } from "http-status-codes";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { requireAuthenticatedUser } from "@middleware/requireAuthenticatedUser";
import { Model } from "../Model";

const router = express.Router({ mergeParams: true });

router.use(requireAccessToken);
router.use(requireAuthenticatedUser);

/* GET all available tags. */
router.get("/", function (req, res) {
  res.status(StatusCodes.OK).send(Model.tagRepository.readAll());
});

/* GET task */
router.get("/:taskUuid", function (req, res) {
  res.status(StatusCodes.OK).send(Model.tagRepository.read(req.params.taskUuid));
});

export { router };
