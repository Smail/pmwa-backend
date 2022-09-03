import { sqlite3 } from "better-sqlite3";
import { ITagsRepository } from "@models/repositories/ITagsRepository";
import { Tag } from "@models/Tag";
import * as ISerializable from "@models/repositories/ISerializable";
import { runTransaction } from "../../../util/db/runTransaction";
import { SQLiteTable } from "@models/repositories/sqlite/SQLiteTable";

export class TagsRepositorySQLite extends SQLiteTable implements ITagsRepository {
  public static readonly tableSchema: string =
    `CREATE TABLE IF NOT EXISTS tags (
        uuid       TEXT UNIQUE NOT NULL,
        taskUuid   TEXT        NOT NULL,
        name       TEXT        NOT NULL,
        color      TEXT        NOT NULL DEFAULT 'red',
        created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uuid, taskUuid),
        FOREIGN KEY (taskUuid) REFERENCES tasks (uuid)
    )

    -- TODO: Make name UNIQUE for each user, but this requires a refactoring,
    --  because it would currently prevent another user from creating the same tag. Do the same for tasks`;

  public constructor(db: sqlite3) {
    super(db, TagsRepositorySQLite.tableSchema);
  }

  public create(tag: Tag): void {
    const queryNoColor = `INSERT INTO tags(uuid, taskUuid, name) VALUES ($tagId, $taskId, $name)`;
    const queryColor = `INSERT INTO tags(uuid, taskUuid, name, color) VALUES ($tagId, $taskId, $name, $color)`;
    runTransaction(this.db, (tag.color != null ? queryColor : queryNoColor), tag.serializeToObject());
  }

  public read(tagId: string): Tag | null {
    const query = `SELECT uuid AS id, taskUuid AS taskId, name, color FROM tags WHERE uuid = $tagId`;
    const row = this.db.prepare(query).get({ tagId: tagId });

    return (row != null) ? ISerializable.deserialize(Tag, row) : null;
  }

  public readAll(): Tag[] {
    const query = `SELECT uuid AS id, taskUuid AS taskId, name, color FROM tags`;
    return this.db.prepare(query).all().map(row => ISerializable.deserialize(Tag, row));
  }

  public update(tag: Tag): void {
    const query = `UPDATE tags SET name = $name, color = $color WHERE uuid = $tagId AND taskUuid = $taskId`;
    runTransaction(this.db, query, { tagId: tag.id, taskId: tag.taskId });
  }

  public delete(tag: Tag): void {
    const query = `DELETE FROM tags WHERE uuid = $tagId AND taskUuid = $taskId`;
    runTransaction(this.db, query, { tagId: tag.id, taskId: tag.taskId });
  }
}
