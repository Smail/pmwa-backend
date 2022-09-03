import { ITasksRepository } from "@models/repositories/ITasksRepository";
import { Task } from "@models/Task";
import { sqlite3 } from "better-sqlite3";
import { ISQLiteTable } from "@models/ISQLiteTable";
import { runTransaction } from "../../../util/db/runTransaction";
import * as ISerializable from "@models/repositories/ISerializable";

export class TasksRepositorySQLite implements ITasksRepository {
  public static readonly table: ISQLiteTable = {
    table(): string {
      return `CREATE TABLE IF NOT EXISTS tasks (
          uuid       TEXT UNIQUE NOT NULL,
          userUuid   TEXT        NOT NULL,
          name       TEXT        NOT NULL,
          content    TEXT,
          isDone     INT                  DEFAULT 0 NOT NULL CHECK ( isDone == 0 OR isDone == 1),
          created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (uuid, userUuid),
          FOREIGN KEY (userUuid) REFERENCES users (uuid) ON UPDATE CASCADE ON DELETE CASCADE
      )`;
    },
  };
  private readonly db: sqlite3;

  public constructor(db: sqlite3) {
    this.db = db;
  }

  public create(task: Task): void {
    const query = `INSERT INTO tasks(uuid, userUuid, name, content, isDone)
                   VALUES ($taskId, $userId, $taskName, $taskContent, $isTaskDone)`;
    runTransaction(this.db, query, task.serializeToObject());
  }

  public read(taskId: string): Task {
    const query = `SELECT uuid AS taskId, userUuid AS userId, name, content, isDone FROM tasks WHERE uuid = $taskId`;
    return ISerializable.deserialize(Task, this.db.prepare(query).get({ taskId: taskId }));
  }

  public readAll(): Task[] {
    const query = `SELECT uuid AS taskId, userUuid AS userId, name, content, isDone FROM tasks`;
    return this.db.prepare(query).all().map(row => ISerializable.deserialize(Task, row));
  }

  public update(task: Task): void {
    const query = `UPDATE tasks
                   SET uuid     = $username,
                       userUuid = $displayName,
                       name     = $firstName,
                       content  = $lastName,
                       isDone   = $passwordHash
                   WHERE uuid = $taskId
                     AND userUuid = $userId`;
    runTransaction(this.db, query, task.serializeToObject());
  }

  public delete(task: Task): void {
    const query = `DELETE FROM tasks WHERE uuid = $taskId AND userUuid = $userId`;
    runTransaction(this.db, query, { taskId: task.id, userId: task.userId });
  }
}
