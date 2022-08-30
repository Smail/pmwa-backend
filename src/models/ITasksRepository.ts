import { IRepository } from "@models/IRepository";
import { Task } from "@models/Task";

export interface ITasksRepository extends IRepository<Task, string> {
  create(task: Task): void;

  read(taskId: string): Task;

  update(task: Task): void;

  delete(task: Task): void;
}
