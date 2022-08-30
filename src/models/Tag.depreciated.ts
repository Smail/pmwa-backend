import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4, validate as isValidUUID } from "uuid";
import * as Database from "../Database";

export class TagDepreciated {
  public readonly uuid: string;
  public readonly taskUuid: string;

  constructor(uuid: string) {
    if (!isValidUUID(uuid)) throw createError(StatusCodes.BAD_REQUEST, `${uuid} is not a valid UUID`);
    this.uuid = uuid;

    const stmt = Database.db.prepare(Database.queries["selectTag"]);
    const tag = stmt.get({ uuid: this.uuid });

    if (tag == null) throw createError(StatusCodes.NOT_FOUND, `No tag exists with ${uuid}`);
    this.taskUuid = tag.taskUuid;
  }

  public get name(): string {
    return Database.db.prepare(Database.queries["selectTagName"]).get({ uuid: this.uuid }).name;
  }

  public set name(v: string) {
    Database.updateColumns("updateTagName", { uuid: this.uuid, name: v }, 1);
  }

  public get color(): string {
    return Database.db.prepare(Database.queries["selectTagColor"]).get({ uuid: this.uuid }).color;
  }

  public set color(v: string) {
    // TODO Check if valid CSS color
    Database.updateColumns("updateTagColor", { uuid: this.uuid, color: v }, 1);
  }

  public static getAllTagNames(): string[] {
    return Database.db.prepare(Database.queries["selectAllTagNames"]).all().map(row => row.name);
  }

  // Don't remove. This is used internally by JSON.stringify
  public toJSON(): {} {
    return { uuid: this.uuid, taskUuid: this.taskUuid, name: this.name, color: this.color };
  }

  public delete(): void {
    Database.db.transaction(() => {
      const stmt = Database.db.prepare(Database.queries["deleteTag"]);
      const info = stmt.run({ uuid: this.uuid });
      if (info.changes > 1) throw createError(StatusCodes.CONFLICT, `Too many rows deleted. Expected 1, but removed ${info.changes}`);
      if (info.changes === 0) throw createError(StatusCodes.NOT_FOUND, "No rows were deleted");
    })();
  }
}

export class TagBuilder {
  private readonly uuid: string;
  private taskUuid: string;
  private name: string;
  private color: string | null;
  private isConsumed: boolean = false;

  public constructor() {
    this.uuid = uuidv4();
  }

  public addTaskUuid(taskUuid: string): TagBuilder {
    if (!isValidUUID(taskUuid)) throw new Error(`IllegalArgument: ${taskUuid} is not a valid UUID`);
    this.taskUuid = taskUuid;
    return this;
  }

  public addName(name: string): TagBuilder {
    this.name = name;
    return this;
  }

  public addColor(color: string | null): TagBuilder {
    // TODO make sure it's a valid CSS color
    this.color = color;
    return this;
  }

  public build(): TagDepreciated {
    if (this.isConsumed) throw new Error("IllegalState: Builder was already consumed.");
    if (!this.name) throw new Error("No name provided");
    this.isConsumed = true;
    let queryName = "insertTag";

    const bindings = {
      uuid: this.uuid,
      taskUuid: this.taskUuid,
      name: this.name,
    };

    if (this.color != null) {
      bindings["color"] = this.color;
    } else {
      queryName += "___DEFAULTS" + "_color";
    }

    Database.db.prepare(Database.queries[queryName]).run(bindings);
    return new TagDepreciated(this.uuid);
  }
}