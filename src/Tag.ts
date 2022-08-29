import { v4 as uuidv4, validate as isValidUUID } from "uuid";
import * as Database from "./Database";
import { NetworkError } from "./NetworkError";
import { StatusCodes } from "http-status-codes";

export class Tag {
  public readonly uuid: string;
  public readonly taskUuid: string;

  constructor(uuid: string) {
    if (!isValidUUID(uuid)) throw new NetworkError(`${uuid} is not a valid UUID`, StatusCodes.BAD_REQUEST);
    this.uuid = uuid;

    const stmt = Database.db.prepare(Database.queries['selectTag']);
    const tag = stmt.get({ uuid: this.uuid });

    if (tag == null) throw new NetworkError(`No tag exists with ${uuid}`, StatusCodes.NOT_FOUND);
    this.taskUuid = tag.taskUuid;
  }

  public set name(v: string) {
    Database.updateColumns('updateTagName', { uuid: this.uuid, name: v }, 1);
  }

  public get name(): string {
    return Database.db.prepare(Database.queries['selectTagName']).get({ uuid: this.uuid }).name;
  }

  public set color(v: string) {
    // TODO Check if valid CSS color
    Database.updateColumns('updateTagColor', { uuid: this.uuid, color: v }, 1);
  }

  public get color(): string {
    return Database.db.prepare(Database.queries['selectTagColor']).get({ uuid: this.uuid }).color;
  }

  // Don't remove. This is used internally by JSON.stringify
  public toJSON(): {} {
    return { uuid: this.uuid, taskUuid: this.taskUuid, name: this.name, color: this.color };
  }

  public delete(): void {
    Database.db.transaction(() => {
      const stmt = Database.db.prepare(Database.queries['deleteTag']);
      const info = stmt.run({ uuid: this.uuid });
      if (info.changes > 1) throw new NetworkError(`Too many rows deleted. Expected 1, but removed ${info.changes}`, StatusCodes.CONFLICT);
      if (info.changes === 0) throw new NetworkError('No rows were deleted.', StatusCodes.NOT_FOUND);
    })();
  }

  public static getAllTagNames(): string[] {
    return Database.db.prepare(Database.queries['selectAllTagNames']).all().map(row => row.name);
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

  public build(): Tag {
    if (this.isConsumed) throw new Error('IllegalState: Builder was already consumed.');
    if (!this.name) throw new Error('No name provided');
    this.isConsumed = true;
    let queryName = 'insertTag';

    const bindings = {
      uuid: this.uuid,
      taskUuid: this.taskUuid,
      name: this.name,
    };

    if (this.color != null) {
      bindings['color'] = this.color;
    } else {
      queryName += '___DEFAULTS' + '_color';
    }

    Database.db.prepare(Database.queries[queryName]).run(bindings);
    return new Tag(this.uuid);
  }
}
