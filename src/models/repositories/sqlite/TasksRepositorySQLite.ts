import { ITasksRepository } from "@models/repositories/ITasksRepository";
import { Task } from "@models/Task";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../../../util/db/runTransaction";
import * as ISerializable from "@models/repositories/ISerializable";
import { User } from "@models/User";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";

export class TasksRepositorySQLite extends SQLiteTable implements ITasksRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS tasks (
        taskId     TEXT UNIQUE NOT NULL,
        userId     TEXT        NOT NULL,
        name       TEXT        NOT NULL,
        content    TEXT,
        isDone     INT                  DEFAULT 0 NOT NULL CHECK (isDone == 0 OR isDone == 1),
        created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (taskId, userId),
        FOREIGN KEY (userId) REFERENCES users (userId) ON UPDATE CASCADE ON DELETE CASCADE
    )`;

  public constructor(db: sqlite3) {
    super(db, TasksRepositorySQLite.tableSchema);
  }

  public create(task: Task): void {
    const query = `INSERT INTO tasks(taskId, userUuid, name, content, isDone)
                   VALUES ($taskId, $userId, $taskName, $taskContent, $isTaskDone)`;
    runTransaction(this.db, query, task.serializeToObject());
  }

  public read(taskId: string): Task | null {
    const query = `SELECT taskId, userId, name, content, isDone FROM tasks WHERE taskId = $taskId`;
    const row = this.db.prepare(query).get({ taskId: taskId });

    return (row != null) ? ISerializable.deserialize(Task, row) : null;
  }

  public readAll(): Task[] {
    const query = `SELECT taskId, userId, name, content, isDone FROM tasks`;
    return this.db.prepare(query).all().map(row => ISerializable.deserialize(Task, row));
  }

  public update(task: Task): void {
    const query = `UPDATE tasks
                   SET name    = $name,
                       content = $content,
                       isDone  = $isDone
                   WHERE taskId = $taskId
                     AND userId = $userId`;
    runTransaction(this.db, query, task.serializeToObject());
  }

  public delete(task: Task): void {
    const query = `DELETE FROM tasks WHERE taskId = $taskId AND userId = $userId`;
    runTransaction(this.db, query, { taskId: task.id, userId: task.userId });
  }

  public getUserTasks(userId: User) {
    const query = `SELECT taskId, userId, name, content, isDone FROM tasks WHERE userId = $userId`;
    return this.db.prepare(query).all({ userId: userId }).map(row => ISerializable.deserialize(Task, row));
  }
}
