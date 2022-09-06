import { ISerializable } from "@models/repositories/ISerializable";
import { v4 as uuidv4, validate as isValidUuid } from "uuid";
import { ITagRecord } from "@models/ITagRecord";
import { Task } from "@models/Task";

export class Tag implements ISerializable {
  public id: string;
  public taskId: string;
  public name: string;
  public color: string | null;

  public static throwIfInvalid({ tagId, taskId, name, color }: ITagRecord): void {
    if (!Tag.isValidId(tagId)) throw new Error(`Invalid argument: tagId = ${tagId}`);
    if (!Task.isValidId(taskId)) throw new Error(`Invalid argument: taskId = ${taskId}`);
    if (name == null || typeof name !== "string") throw new Error(`Invalid argument: name = ${name}`);
    if (color != null && typeof color !== "string") throw new Error(`Invalid argument: color = ${color}`);
  }

  public static isValidId(tagId: string): boolean {
    return isValidUuid(tagId);
  }

  public assignUniqueId(): void {
    this.id = uuidv4();
  }

  public deserializeFromObject({ tagId, taskId, name, color }: ITagRecord): void {
    Tag.throwIfInvalid({ tagId, taskId, name, color });
    this.id = tagId;
    this.taskId = taskId;
    this.name = name;
    this.color = (typeof color === "string") ? color : null;
  }

  public serializeToObject(): ITagRecord {
    const o = { tagId: this.id, taskId: this.taskId, name: this.name, color: this.color };
    Tag.throwIfInvalid(o);
    return o;
  }
}
