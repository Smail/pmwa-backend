import { sqlite3 } from "better-sqlite3";
import { ITagsRepository } from "@models/ITagsRepository";
import { Tag } from "@models/Tag";
import { ISQLiteTable } from "@models/ISQLiteTable";
import * as ISerializable from "@models/ISerializable";
import { runTransaction } from "../util/db/runTransaction";

export class TagsRepositorySQLite implements ITagsRepository {
  public static readonly table: ISQLiteTable = {
    table(): string {
      return `CREATE TABLE IF NOT EXISTS tags (
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
    },
  };
  private readonly db: sqlite3;

  public constructor(db: sqlite3) {
    this.db = db;
  }

  public create(tag: Tag): void {
    const queryNoColor = `INSERT INTO tags(uuid, taskUuid, name) VALUES ($tagId, $taskId, $name)`;
    const queryColor = `INSERT INTO tags(uuid, taskUuid, name, color) VALUES ($tagId, $taskId, $name, $color)`;
    runTransaction(this.db, (tag.color != null ? queryColor : queryNoColor), tag.serializeToObject());
  }

  public read(tagId: string): Tag {
    const query = `SELECT uuid AS id, taskUuid AS taskId, name, color FROM tags WHERE uuid = $tagId`;
    return ISerializable.deserialize(Tag, this.db.prepare(query).get({ tagId: tagId }));
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
