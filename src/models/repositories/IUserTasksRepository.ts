import { IRepository } from "@models/repositories/IRepository";
import { User } from "@models/User";
import { Task } from "@models/Task";

export interface IUserTasksRepository extends IRepository<Task, string> {
  readonly user: User;

  create(task: Task): void;

  read(taskId: string): Task | null;

  readAll(): Task[];

  update(task: Task): void;

  delete(task: Task): void;
}
