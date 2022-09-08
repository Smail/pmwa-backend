import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Task } from "@models/Task";
import { Model } from "../Model";
import { UserTasksRepositorySQLite } from "@models/repositories/sqlite/UserTasksRepositorySQLite";
import { User } from "@models/User";
import { ITaskRecord } from "@models/ITaskRecord";

export const get_tasks = (req: { user: User }, res) => {
  res.send(new UserTasksRepositorySQLite(Model.db, req.user).readAll());
};

export const get_task = (req: { user: User; params: { taskId: string } }, res) => {
  const task = new UserTasksRepositorySQLite(Model.db, req.user).read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Unknown task ID");

  res.send(task);
};

export const create_task = (req: { user: User; task: ITaskRecord }, res) => {
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task: Task = new Task();

  task.assignUniqueId();
  task.userId = req.user.id;
  task.name = req.task.name;
  task.content = req.task.content;
  task.isDone = req.task.isDone;

  Model.tasksRepository.create(task);
  userTasksRepository.create(task);
  res.status(StatusCodes.CREATED).send({ uuid: task.id });
};

export const update_task = (req: { body: ITaskRecord; user: User; params: { taskId: string } }, res) => {
  const { name, content, isDone } = req.body;
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task = userTasksRepository.read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Task not found");

  if (name) task.name = name;
  if (content) task.content = content;
  if (isDone) task.isDone = isDone;

  Model.tasksRepository.update(task);
  res.sendStatus(StatusCodes.OK);
};

export const delete_task = (req: { user: User; params: { taskId: string } }, res) => {
  const userTasksRepository = new UserTasksRepositorySQLite(Model.db, req.user);
  const task = userTasksRepository.read(req.params.taskId);
  if (task == null) throw createError(StatusCodes.NOT_FOUND, "Task not found");

  userTasksRepository.delete(task);
  res.sendStatus(StatusCodes.OK);
};
