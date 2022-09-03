import { IRepository } from "@models/repositories/IRepository";
import { Task } from "@models/Task";
import { User } from "@models/User";

export interface ITasksRepository extends IRepository<Task, string> {
  create(task: Task): void;

  read(taskId: string): Task;

  readAll(): Task[];

  update(task: Task): void;

  delete(task: Task): void;

  getUserTasks(user: User);
}
