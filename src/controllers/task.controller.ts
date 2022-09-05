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
  const { name, content, isDone } = req.body;
  const task = Model.tasksRepository.read(req.body.uuid);

  if (task == null) return next(createError(StatusCodes.NOT_FOUND, "Task not found"));

  // TODO validity checks
  if (name) task.name = name;
  if (content) task.content = content;
  if (isDone) task.isDone = isDone;

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
