import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Task } from "@models/Task";
import { Model } from "../Model";
import { UserTasksRepositorySQLite } from "@models/repositories/sqlite/UserTasksRepositorySQLite";
import { User } from "@models/User";

export const get_tasks = (req: { user: User }, res) => {
  res.send(new UserTasksRepositorySQLite(Model.db, req.user).readAll());
};

export const get_task = (req: { user: User; params: { taskId: string } }, res) => {
  const task = new UserTasksRepositorySQLite(Model.db, req.user).read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Unknown task ID");

  res.send(task);
};

export const create_task = (req: { user: User; body: { name: string, content: string | null, isDone: boolean | null } }, res) => {
  if (req.body.name == null) throw createError(StatusCodes.BAD_REQUEST, "Missing required argument 'name'");

  if (req.body.name != null && typeof req.body.name !== "string") {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid type: name is not a string`);
  }
  if (req.body.content != null && typeof req.body.content !== "string") {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid type: content is not a string`);
  }
  if (req.body.isDone != null && typeof req.body.isDone !== "boolean") {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid type: isDone is not a boolean`);
  }

  const task = new Task();
  task.name = req.body.name;
  if (req.body.content != null) task.content = req.body.content;
  if (req.body.isDone != null) task.isDone = req.body.isDone;

  Model.tasksRepository.create(task);
  new UserTasksRepositorySQLite(Model.db, req.user).create(task);
  res.status(StatusCodes.CREATED).send({ taskId: task.id });
};

export const update_task = (req: {
  body: {
    name: string | null, content: string | null, isDone: boolean | null,
  }; user: User; params: { taskId: string }
}, res) => {
  const { name, content, isDone } = req.body;
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task = userTasksRepository.read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Task not found");

  if (!Task.isValidId(req.params.taskId)) {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid argument: invalid ID taskId = ${req.params.taskId}`);
  }
  if (name != null && typeof name !== "string") {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid type: name is not a string`);
  }
  if (content != null && typeof content !== "string") {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid type: content is not a string`);
  }
  if (isDone != null && typeof isDone !== "boolean") {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid type: isDone is not a boolean`);
  }

  if (name != null) task.name = name;
  if (content != null) task.content = content;
  if (isDone != null) task.isDone = isDone;

  Model.tasksRepository.update(task);
  res.sendStatus(StatusCodes.NO_CONTENT);
};

export const delete_task = (req: { user: User; params: { taskId: string } }, res) => {
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task = userTasksRepository.read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Task not found");

  Model.tasksRepository.delete(task);
  res.sendStatus(StatusCodes.NO_CONTENT);
};
