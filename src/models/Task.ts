import { ISerializable } from "@models/repositories/ISerializable";
import { v4 as uuidv4, validate as isValidUuid } from "uuid";
import { User } from "@models/User";
import { ITaskRecord } from "@models/ITaskRecord";

export class Task implements ISerializable {
  // TODO default values
  public id: string;
  public userId: string;
  public name: string;
  public content: string | null;
  public isDone: boolean;

  public static isValidId(taskId: string) {
    return isValidUuid(taskId);
  }

  public static throwIfInvalid({ taskId, userId, name, content, isDone }: ITaskRecord): void {
    if (!Task.isValidId(taskId)) throw new Error(`Invalid argument: taskId = ${taskId}`);
    if (!User.isValidId(userId)) throw new Error(`Invalid argument: userId = ${userId}`);
    if (name == null) throw new Error(`Invalid argument: name is null`);
    if (content != null && typeof content !== "string") throw new Error(`Invalid argument: content is not a string or null`);
    if (isDone == null) throw new Error(`Invalid argument: isDone is null`);
    if (typeof isDone === "boolean") throw new Error(`Invalid argument: isDone is not of type boolean`);
  }

  public assignUniqueId(): void {
    this.id = uuidv4();
  }

  // TODO assign only if not null else default value
  public deserializeFromObject({ taskId, userId, name, content, isDone }: ITaskRecord): void {
    Task.throwIfInvalid({ taskId, userId, name, content, isDone });
    // TODO loop over typescript class object https://stackoverflow.com/a/66645452/9258134
    this.id = taskId;
    this.userId = userId;
    this.name = name;
    this.content = content;
    this.isDone = isDone;
  }

  public serializeToObject(): ITaskRecord {
    const o: ITaskRecord = {
      taskId: this.id,
      userId: this.userId,
      name: this.name,
      content: this.content,
      isDone: this.isDone,
    };
    Task.throwIfInvalid(o);
    return o;
  }
}
