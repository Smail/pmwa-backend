import { IRepository } from "@models/repositories/IRepository";
import { Task } from "@models/Task";

export interface ITasksRepository extends IRepository<Task, string> {
  create(task: Task): void;

  read(taskId: string): Task;

  readAll(taskId: string): Task[];

  update(task: Task): void;

  delete(task: Task): void;
}
