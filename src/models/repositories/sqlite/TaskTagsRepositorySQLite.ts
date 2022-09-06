import { Task } from "@models/Task";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";
import { sqlite3 } from "better-sqlite3";
import { ITaskTagsRepository } from "@models/repositories/ITaskTagsRepository";
import { Tag } from "@models/Tag";
import { runTransaction } from "../../../util/db/runTransaction";
import * as ISerializable from "@models/repositories/ISerializable";

export class TaskTagsRepositorySQLite extends SQLiteTable implements ITaskTagsRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS TaskTags (
        taskId TEXT NOT NULL,
        tagId  TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES Tasks (taskId) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES Tags (tagId) ON UPDATE CASCADE ON DELETE CASCADE,
        PRIMARY KEY (taskId, tagId)
    )`;
  public readonly task: Task;

  public constructor(db: sqlite3, task: Task) {
    super(db, TaskTagsRepositorySQLite.tableSchema);
    this.task = task;
  }

  public create(tag: Tag): void {
    const query = `INSERT INTO TaskTags(taskId, tagId) VALUES ($taskId, $tagId)`;
    runTransaction(this.db, query, { taskId: this.task.id, tagId: tag.id });
  }

  public read(tagId: string): Tag | null {
    const query = `SELECT *
                   FROM Tags
                            JOIN TaskTags ON Tags.tagId = TaskTags.tagId
                   WHERE TaskTags.taskId = $taskId
                     AND TaskTags.tagId = $tagId`;
    const row = this.db.perpare(query).get({ taskId: this.task.id, tagId: tagId });

    return (row != null) ? ISerializable.deserialize(Tag, row) : null;
  }

  public readAll(): Tag[] {
    const query = `SELECT *
                   FROM Tags
                            JOIN TaskTags ON Tags.tagId = TaskTags.tagId
                   WHERE TaskTags.taskId = $taskId`;
    return this.db.prepare(query)
      .all({ taskId: this.task.id })
      .map(row => ISerializable.deserialize(Task, row));
  }

  public update(tag: Tag): void {
    throw new Error("Updating a relationship directly is forbidden");
  }

  public delete(tag: Tag): void {
    throw new Error("Deleting a relationship directly is forbidden");
  }
}
