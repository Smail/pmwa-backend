import { v4 as uuidv4, validate as isValidUUID } from "uuid";
import * as Database from "./database";
import { NetworkError } from "./NetworkError";
import { StatusCodes } from "http-status-codes";

export class Task {
  public readonly uuid: string;
  public readonly userUuid: string;

  constructor(uuid: string) {
    if (!isValidUUID(uuid)) throw new Error(`IllegalArgument: ${uuid} is not a valid UUID`);
    this.uuid = uuid;

    const stmt = Database.db.prepare(Database.queries['selectTask']);
    const task = stmt.get({uuid: this.uuid});

    if (task == null) throw new Error(`IllegalArgument: No task exists with ${uuid}`);

    this.userUuid = task.userUuid;
  }

  public set content(v: string) {
    Database.db.transaction(() => {
      const stmt = Database.db.prepare(Database.queries['updateTaskContent']);
      const info = stmt.run({uuid: this.uuid, content: v});
      if (info.changes > 1) throw new Error(`Too many rows updated. Expected 1, but updated ${info.changes}`);
      if (info.changes == 0) throw new Error('No rows were updated. Probably no such UUID');
    })();
  }

  public get content(): string {
    const stmt = Database.db.prepare(Database.queries['selectTaskContent']);
    return stmt.get({uuid: this.uuid}).content;
  }

  // Don't remove. This is used internally by JSON.stringify
  public toJSON(): {} {
    return {uuid: this.uuid, userUuid: this.userUuid, content: this.content};
  }

  public delete(): void {
    Database.db.transaction(() => {
      const stmt = Database.db.prepare(Database.queries['deleteTask']);
      const info = stmt.run({uuid: this.uuid});
      if (info.changes > 1) throw new NetworkError(`Too many rows deleted. Expected 1, but removed ${info.changes}`, StatusCodes.CONFLICT);
      if (info.changes == 0) throw new NetworkError('No rows were deleted.', StatusCodes.NOT_FOUND);
    })();
  }
}

export class TaskBuilder {
  private readonly uuid: string;
  private userUuid: string;
  private content: string;
  private isConsumed: boolean = false;

  public constructor() {
    this.uuid = uuidv4();
  }

  public addUserUuid(userUuid: string): TaskBuilder {
    if (!isValidUUID(userUuid)) throw new Error(`IllegalArgument: ${userUuid} is not a valid UUID`);
    this.userUuid = userUuid;
    return this;
  }

  public addContent(content: string): TaskBuilder {
    this.content = content;
    return this;
  }

  public build(): Task {
    if (this.isConsumed) throw new Error('IllegalState: Builder was already consumed.');
    if (!this.content) throw new Error('IllegalState: No content was supplied to the Builder.');
    this.isConsumed = true;

    const bindings = {
      uuid: this.uuid,
      userUuid: this.userUuid,
      content: this.content,
    };

    console.log(bindings)

    Database.db.prepare(Database.queries['insertTask']).run(bindings);
    return new Task(this.uuid);
  }
}
