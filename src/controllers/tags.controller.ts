import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { TaskTagsRepositorySQLite } from "@models/repositories/sqlite/TaskTagsRepositorySQLite";
import { UserTasksRepositorySQLite } from "@models/repositories/sqlite/UserTasksRepositorySQLite";

export const get_tags = (req, res) => {
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task = userTasksRepository.read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Task not found");

  res.status(StatusCodes.OK).send(new TaskTagsRepositorySQLite(Model.db, task).readAll());
};

export const get_tag = (req, res) => {
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task = userTasksRepository.read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Task not found");

  res.status(StatusCodes.OK).send(new TaskTagsRepositorySQLite(Model.db, task).read(req.params.taskId));
};
