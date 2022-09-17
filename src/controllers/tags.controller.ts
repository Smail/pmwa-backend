import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { TaskTagsRepositorySQLite } from "@models/repositories/sqlite/TaskTagsRepositorySQLite";
import { UserTasksRepositorySQLite } from "@models/repositories/sqlite/UserTasksRepositorySQLite";
import { User } from "@models/User";
import { Task } from "@models/Task";
import { Tag } from "@models/Tag";

function checkReqThrowIfInvalid(req: { params: { taskId: any } }) {
  const taskId = req.params.taskId;
  if (typeof taskId !== "string") {
    throw createError(StatusCodes.BAD_REQUEST,
      `Invalid type: taskId with value ${taskId} is of type ${typeof taskId} instead of string`);
  }
  if (!Task.isValidId(taskId)) throw createError(StatusCodes.BAD_REQUEST, `Invalid ID = ${taskId}`);
}

export const get_tags = (req: { user?: any; params: { taskId: string; }; }, res) => {
  checkReqThrowIfInvalid(req);
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task = userTasksRepository.read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Task not found");

  res.send(new TaskTagsRepositorySQLite(Model.db, task).readAll());
};

export const get_tag = (req: { user: User; params: { taskId: string; }; }, res) => {
  checkReqThrowIfInvalid(req);
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task = userTasksRepository.read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, `Task not found. Task ID = ${req.params.taskId}`);

  res.send(new TaskTagsRepositorySQLite(Model.db, task).read(req.params.taskId));
};
