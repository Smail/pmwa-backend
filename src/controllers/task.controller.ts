import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Task } from "@models/Task";
import { Model } from "../Model";
import { UserTasksRepositorySQLite } from "@models/repositories/sqlite/UserTasksRepositorySQLite";
import { User } from "@models/User";
import moment from "moment";

function parseDate(dateString: string | null) {
  if (dateString == null) return null;
  if (typeof dateString !== "string") {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid type: startDate is not a string`);
  }

  try {
    return new Date(dateString);
  } catch (error) {
    throw createError(StatusCodes.BAD_REQUEST, `Invalid argument: startDate cannot be parsed into a Date object`);
  }
}

export const get_tasks = (req: { user: User }, res) => {
  res.send(new UserTasksRepositorySQLite(Model.db, req.user).readAll());
};

export const get_task = (req: { user: User; params: { taskId: string } }, res) => {
  const task = new UserTasksRepositorySQLite(Model.db, req.user).read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Unknown task ID");

  res.send(task);
};

export const create_task = (req: {
  user: User;
  body: {
    name: string, content: string | null, isDone: boolean | null,
    startDate: string | null, endDate: string | null
  };
}, res) => {
  if (req.body.name == null) {
    throw createError(StatusCodes.BAD_REQUEST, "Missing required argument 'name'");
  }
  if (typeof req.body.name !== "string") {
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
  if (req.body.startDate != null) task.startDate = parseDate(req.body.startDate);
  if (req.body.endDate != null) task.endDate = parseDate(req.body.endDate);

  if (task.startDate == null && task.endDate != null) {
    throw createError(StatusCodes.BAD_REQUEST, `Inconsistent state: Passed an end date without a start date`);
  }
  if (task.endDate == null && task.startDate != null) {
    throw createError(StatusCodes.BAD_REQUEST, `Inconsistent state: Passed a start date without an end date`);
  }

  if (moment(task.startDate).isSameOrAfter(moment(task.endDate))) {
    throw createError(StatusCodes.UNPROCESSABLE_ENTITY,
      `Start date (${task.startDate}) is same or after end date ${task.endDate}`);
  }

  Model.tasksRepository.create(task);
  new UserTasksRepositorySQLite(Model.db, req.user).create(task);
  res.status(StatusCodes.CREATED).send({ taskId: task.id });
};

export const update_task = (req: {
  user: User;
  params: { taskId: string };
  body: {
    name: string | null, content: string | null, isDone: string | boolean | null,
    startDate: string | null, endDate: string | null,
  };
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
  if (isDone != null) {
    if (typeof isDone !== "boolean") {
      throw createError(StatusCodes.BAD_REQUEST, `Invalid type: Expected bool. isDone: ${typeof isDone} = ${isDone}`);
    }
    task.isDone = isDone;
  }

  if (name != null) task.name = name;
  if (content != null) task.content = content;
  if (req.body.startDate != null) task.startDate = parseDate(req.body.startDate);
  if (req.body.endDate != null) task.endDate = parseDate(req.body.endDate);

  if (task.startDate == null && task.endDate != null) {
    throw createError(StatusCodes.BAD_REQUEST, `Inconsistent state: Passed an end date without a start date`);
  }
  if (task.endDate == null && task.startDate != null) {
    throw createError(StatusCodes.BAD_REQUEST, `Inconsistent state: Passed a start date without an end date`);
  }

  // TODO check if end date is after start date also in create task, maybe make SQL constraint
  if (moment(task.startDate).isSameOrAfter(moment(task.endDate))) {
    throw createError(StatusCodes.UNPROCESSABLE_ENTITY,
      `Start date (${task.startDate}) is same or after end date ${task.endDate}`);
  }

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
