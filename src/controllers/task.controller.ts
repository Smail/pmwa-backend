import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { validate as isValidUuid } from "uuid";
import { Task } from "@models/Task";
import { Model } from "../Model";

export const get_tasks = (req, res) => {
  res.status(StatusCodes.OK).send(Model.tasksRepository.getUserTasks(req.user));
};

export const create_task = (req, res) => {
  const task: Task = new Task();
  task.assignUniqueId();
  task.userId = req.user.uuid;
  task.name = req.task.name;
  task.content = req.task.content;

  Model.tasksRepository.create(task);
  res.status(StatusCodes.CREATED).send({ uuid: task.id });
};

export const update_task = (req, res, next) => {
  if (!req.body) return next(createError(StatusCodes.BAD_REQUEST, "Request body is falsy"));
  if (!isValidUuid(req.body.uuid)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid UUID"));

  const task: Task = new Task();
  // TODO throw error if exists but type is wrong
  if (req.body.name && typeof req.body.name === "string") task.name = req.body.name;
  if (req.body.isDone && typeof req.body.isDone === "boolean") task.isDone = req.body.isDone;
  if (req.body.content && typeof req.body.content === "string") task.content = req.body.content;

  Model.tasksRepository.update(task);

  res.sendStatus(StatusCodes.OK);
};

export const delete_task = (req, res, next) => {
  if (!req.params.uuid) return next(createError(StatusCodes.BAD_REQUEST, "No UUID provided"));
  if (!isValidUuid(req.params.uuid)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid UUID"));
  const task: Task = new Task();
  task.id = req.params.uuid;

  Model.tasksRepository.delete(task);

  res.sendStatus(StatusCodes.OK);
};
