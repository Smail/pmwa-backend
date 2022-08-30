import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { validate as isValidUUID } from "uuid";
import { Task, TaskBuilder } from "@models/Task";
import { User } from "@models/User";

export const get_tasks = (req, res) => {
  // @ts-ignore TODO
  const user: User = req.user;
  const tasks: Task[] = user.tasks;

  res.status(StatusCodes.OK).send(JSON.stringify(tasks));
};

export const create_task = (req, res) => {
  const task: Task = new TaskBuilder()
    // @ts-ignore TODO
    .addUserUuid(req.user.uuid)
    // @ts-ignore TODO
    .addName(req.task.name)
    // @ts-ignore TODO
    .addContent(req.task.content) // can be null
    .build();

  res.status(StatusCodes.CREATED).send({ uuid: task.uuid });
};

export const update_task = (req, res, next) => {
  if (!req.body) return next(createError(StatusCodes.BAD_REQUEST, "Request body is falsy"));

  // @ts-ignore TODO
  const task = new Task(req.task.uuid);

  if (req.body.name && typeof req.body.name === "string") task.name = req.body.name;
  if (req.body.isDone && typeof req.body.isDone === "boolean") task.isDone = req.body.isDone;
  if (req.body.content && typeof req.body.content === "string") task.content = req.body.content;

  res.sendStatus(StatusCodes.OK);
};

export const delete_task = (req, res, next) => {
  if (!req.params.uuid) return next(createError(StatusCodes.BAD_REQUEST, "No UUID provided"));
  if (!isValidUUID(req.params.uuid)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid UUID"));
  // @ts-ignore TODO
  new Task(req.params.uuid).delete();

  res.sendStatus(StatusCodes.OK);
};
