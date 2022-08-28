import { v4 as uuidv4, validate as isValidUUID } from "uuid";
import * as Database from "./database";
import { NetworkError } from "./NetworkError";
import { StatusCodes } from "http-status-codes";
import { Tag } from "./Tag";

export class Task {
  public readonly uuid: string;
  public readonly userUuid: string;

  constructor(uuid: string) {
    if (!isValidUUID(uuid)) throw new NetworkError(`${uuid} is not a valid UUID`, StatusCodes.BAD_REQUEST);
    this.uuid = uuid;

    const stmt = Database.db.prepare(Database.queries['selectTask']);
    const task = stmt.get({uuid: this.uuid});

    if (task == null) throw new NetworkError(`No task exists with ${uuid}`, StatusCodes.NOT_FOUND);
    this.userUuid = task.userUuid;
  }

  public set name(v: string) {
    Database.updateColumns('updateTaskName', { uuid: this.uuid, name: v }, 1);
  }

  public get name(): string {
    const stmt = Database.db.prepare(Database.queries['selectTaskName']);
    return stmt.get({uuid: this.uuid}).name;
  }

  public set content(v: string) {
    Database.updateColumns('updateTaskContent', { uuid: this.uuid, content: v }, 1);
  }

  public get content(): string {
    const stmt = Database.db.prepare(Database.queries['selectTaskContent']);
    return stmt.get({uuid: this.uuid}).content;
  }

  public set isDone(v: boolean) {
    Database.updateColumns('updateTaskIsDone', { uuid: this.uuid, isDone: (v ? 1 : 0) }, 1);
  }

  public get isDone(): boolean {
    const stmt = Database.db.prepare(Database.queries['selectTaskIsDone']);
    return stmt.get({uuid: this.uuid}).isDone == 1;
  }

  public get tags(): Tag[] {
    const stmt = Database.db.prepare(Database.queries['selectAllTagsOfTask']);
    const rows = stmt.all({taskUuid: this.uuid});

    return rows.map(row => new Tag(row.uuid));
  }

  // Don't remove. This is used internally by JSON.stringify
  public toJSON(): {} {
    return {uuid: this.uuid, userUuid: this.userUuid, name: this.name, content: this.content, isDone: this.isDone};
  }

  public delete(): void {
    Database.db.transaction(() => {
      const stmt = Database.db.prepare(Database.queries['deleteTask']);
      const info = stmt.run({uuid: this.uuid});
      if (info.changes > 1) throw new NetworkError(`Too many rows deleted. Expected 1, but removed ${info.changes}`, StatusCodes.CONFLICT);
      if (info.changes == 0) throw new NetworkError('No rows were deleted.', StatusCodes.NOT_FOUND);
    })();
  }

  /**
   * Return the UUIDs of all tasks, that are tagged with the specified tag name.
   * @param {string} tagName The tag name to search for.
   * @returns {string[]} List of UUID strings.
   */
  public static withTagName(tagName: string): string[] {
    if (!tagName) throw new Error('Argument is falsy');
    const stmt = Database.db.prepare(Database.queries['selectAllTasksWithTagName']);
    const rows = stmt.all({ name: tagName });

    return rows.map(row => row.taskUuid);
  }

  /**
   * Return the UUIDs of all tasks, that are tagged with the specified tag UUID.
   * @param tagUuid The UUID to search for.
   * @returns {string[]} List of UUID strings.
   */
  public static withTagUUID(tagUuid: string): string[] {
    if (!isValidUUID(tagUuid)) throw new Error('Invalid UUID');
    const stmt = Database.db.prepare(Database.queries['selectAllTasksWithTagUuid']);
    const rows = stmt.all({ uuid: tagUuid });

    return rows.map(row => row.taskUuid);
  }
}

export class TaskBuilder {
  private readonly uuid: string;
  private userUuid: string;
  private name: string;
  private content: string | null;
  private isConsumed: boolean = false;

  public constructor() {
    this.uuid = uuidv4();
  }

  public addUserUuid(userUuid: string): TaskBuilder {
    if (!isValidUUID(userUuid)) throw new Error(`IllegalArgument: ${userUuid} is not a valid UUID`);
    this.userUuid = userUuid;
    return this;
  }

  public addName(name: string): TaskBuilder {
    this.name = name;
    return this;
  }

  public addContent(content: string | null): TaskBuilder {
    this.content = content;
    return this;
  }

  public build(): Task {
    if (this.isConsumed) throw new Error('IllegalState: Builder was already consumed.');
    if (!this.name) throw new Error('No name provided');
    this.isConsumed = true;

    const bindings = {
      uuid: this.uuid,
      userUuid: this.userUuid,
      name: this.name,
      content: this.content,
    };

    Database.db.prepare(Database.queries['insertTask']).run(bindings);
    return new Task(this.uuid);
  }
}
