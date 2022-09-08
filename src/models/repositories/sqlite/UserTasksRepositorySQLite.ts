import { IUserTasksRepository } from "@models/repositories/IUserTasksRepository";
import { User } from "@models/User";
import { Task } from "@models/Task";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../../../util/db/runTransaction";
import * as ISerializable from "@models/repositories/ISerializable";

export class UserTasksRepositorySQLite extends SQLiteTable implements IUserTasksRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS UserTasks (
        userId TEXT NOT NULL,
        taskId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES Users (userId) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (taskId) REFERENCES Tasks (taskId) ON UPDATE CASCADE ON DELETE CASCADE,
        PRIMARY KEY (userId, taskId)
    )`;
  public readonly user: User;

  public constructor(db: sqlite3, user: User) {
    super(db, UserTasksRepositorySQLite.tableSchema);
    this.user = user;
  }

  public create(task: Task): void {
    const query = `INSERT INTO UserTasks(userId, taskId) VALUES ($userId, $taskId)`;
    runTransaction(this.db, query, { userId: this.user.id, taskId: task.id });
  }

  public read(taskId: string): Task | null {
    const query = `SELECT *
                   FROM Tasks
                            JOIN UserTasks ON Tasks.taskId = UserTasks.taskId
                   WHERE UserTasks.taskId = $taskId
                     AND UserTasks.userId = $userId`;
    const row = this.db.prepare(query).get({ userId: this.user.id, taskId: taskId });

    return (row != null) ? ISerializable.deserialize(Task, row) : null;
  }

  public readAll(): Task[] {
    const query = `SELECT *
                   FROM Tasks
                            JOIN UserTasks ON Tasks.taskId = UserTasks.taskId
                   WHERE UserTasks.userId = $userId`;
    return this.db.prepare(query)
      .all({ userId: this.user.id })
      .map(row => ISerializable.deserialize(Task, row));
  }

  public update(task: Task): void {
    throw new Error("Updating a relationship directly is forbidden. Updates will cascade automagically.");
  }

  public delete(task: Task): void {
    throw new Error("Deleting a relationship directly is forbidden. Deletions will cascade automagically.");
  }
}
