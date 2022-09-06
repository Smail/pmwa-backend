import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { Task } from "@models/Task";
import { User } from "@models/User";

export const get_tags = (req, res) => {
  const task = new Task();
  const user: User = req.user;

  task.id = req.params.taskId;
  task.userId = user.id;

  res.status(StatusCodes.OK).send(Model.tagRepository.getTaskTags(task));
}

export const get_tag = (req, res) => {
  res.status(StatusCodes.OK).send(Model.tagRepository.read(req.body.uuid));
}
