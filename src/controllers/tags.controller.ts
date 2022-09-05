import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";

export const get_tags = (req, res) => {
  res.status(StatusCodes.OK).send(Model.tagRepository.readAll());
}

export const get_tag = (req, res) => {
  res.status(StatusCodes.OK).send(Model.tagRepository.read(req.params.taskUuid));
}
