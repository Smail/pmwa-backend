import { ISerializable } from "@models/repositories/ISerializable";
import { v4 as uuidv4 } from "uuid";

export class Tag implements ISerializable {
  public id: string;
  public taskId: string;
  public name: string;
  public color: string | null;

  public assignUniqueId(): void {
    this.id = uuidv4();
  }

  public toJSON(): object {
    return this.serializeToObject();
  }

  public deserializeFromObject({ tagId, taskId, name, color }): void {
    // TODO check if values are valid
    this.id = tagId;
    this.taskId = taskId;
    this.name = name;
    this.color = (typeof color === "string") ? color : null;
  }

  public serializeToObject(): Object {
    return { tagId: this.id, taskId: this.taskId, name: this.name, color: this.color };
  }
}
