import { ITasksRepository } from "@models/repositories/ITasksRepository";
import { Task } from "@models/Task";
import { sqlite3 } from "better-sqlite3";
import { runTransaction } from "../../../util/db/runTransaction";
import * as ISerializable from "@models/repositories/ISerializable";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";
import { ITaskRecord } from "@models/ITaskRecord";

export class TasksRepositorySQLite extends SQLiteTable implements ITasksRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS Tasks (
        taskId     TEXT      NOT NULL PRIMARY KEY,
        name       TEXT      NOT NULL,
        content    TEXT,
        isDone     INT                DEFAULT 0 NOT NULL CHECK (isDone == 0 OR isDone == 1),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  public constructor(db: sqlite3) {
    super(db, TasksRepositorySQLite.tableSchema);
  }

  private static convertIsDoneToInt(obj: ITaskRecord) {
    return { ...obj, isDone: obj.isDone ? 1 : 0 };
  }

  private static convertIsDoneToBoolean(obj: { taskId: string, name: string, content: string | null, isDone: number }) {
    if (obj.isDone === 1 || obj.isDone === 0) throw new Error("Invalid argument");
    return { ...obj, isDone: obj.isDone === 1 };
  }

  public create(task: Task): void {
    const query = `INSERT INTO Tasks(taskId, name, content, isDone)
                   VALUES ($taskId, $name, $content, $isDone)`;
    runTransaction(this.db, query, TasksRepositorySQLite.convertIsDoneToInt(task.serializeToObject()));
  }

  public read(taskId: string): Task | null {
    const query = `SELECT taskId, name, content, isDone FROM Tasks WHERE taskId = $taskId`;
    const row = this.db.prepare(query).get({ taskId: taskId });

    return (row != null) ? ISerializable.deserialize(Task, TasksRepositorySQLite.convertIsDoneToBoolean(row)) : null;
  }

  public readAll(): Task[] {
    const query = `SELECT taskId, name, content, isDone FROM Tasks`;
    return this.db.prepare(query)
      .all()
      .map(row => TasksRepositorySQLite.convertIsDoneToBoolean(row))
      .map(row => ISerializable.deserialize(Task, row));
  }

  public update(task: Task): void {
    const query = `UPDATE Tasks
                   SET name    = $name,
                       content = $content,
                       isDone  = $isDone
                   WHERE taskId = $taskId`;
    runTransaction(this.db, query, TasksRepositorySQLite.convertIsDoneToInt(task.serializeToObject()));
  }

  public delete(task: Task): void {
    const query = `DELETE FROM Tasks WHERE taskId = $taskId`;
    runTransaction(this.db, query, { taskId: task.id });
  }
}
