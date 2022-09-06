import { sqlite3 } from "better-sqlite3";
import { ITagsRepository } from "@models/repositories/ITagsRepository";
import { Tag } from "@models/Tag";
import * as ISerializable from "@models/repositories/ISerializable";
import { runTransaction } from "../../../util/db/runTransaction";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";
import { Task } from "@models/Task";

export class TagsRepositorySQLite extends SQLiteTable implements ITagsRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS Tags (
        tagId      TEXT      NOT NULL PRIMARY KEY,
        name       TEXT      NOT NULL,
        color      TEXT      NOT NULL DEFAULT 'red',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

  public constructor(db: sqlite3) {
    super(db, TagsRepositorySQLite.tableSchema);
  }

  public create(tag: Tag): void {
    const queryNoColor = `INSERT INTO tags(tagId, taskId, name) VALUES ($tagId, $taskId, $name)`;
    const queryColor = `INSERT INTO tags(tagId, taskId, name, color) VALUES ($tagId, $taskId, $name, $color)`;
    runTransaction(this.db, (tag.color != null ? queryColor : queryNoColor), tag.serializeToObject());
  }

  public read(tagId: string): Tag | null {
    const query = `SELECT tagId, taskId, name, color FROM tags WHERE tagId = $tagId`;
    const row = this.db.prepare(query).get({ tagId: tagId });

    return (row != null) ? ISerializable.deserialize(Tag, row) : null;
  }

  public readAll(): Tag[] {
    const query = `SELECT tagId, taskId, name, color FROM tags`;
    return this.db.prepare(query).all().map(row => ISerializable.deserialize(Tag, row));
  }

  public update(tag: Tag): void {
    const query = `UPDATE tags SET name = $name, color = $color WHERE tagId = $tagId AND taskId = $taskId`;
    runTransaction(this.db, query, { tagId: tag.id, taskId: tag.taskId });
  }

  public delete(tag: Tag): void {
    const query = `DELETE FROM tags WHERE tagId = $tagId AND taskId = $taskId`;
    runTransaction(this.db, query, { tagId: tag.id, taskId: tag.taskId });
  }

  public getTaskTags(task: Task): Tag[] {
    const query = `SELECT tagId, taskId, name, color FROM tags WHERE taskId = $taskId`;
    return this.db.prepare(query).all({ taskId: task.id }).map(row => ISerializable.deserialize(Tag, row));
  }
}
