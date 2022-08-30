import { ISerializable } from "@models/ISerializable";

export class Tag implements ISerializable {
  public id: string;
  public taskId: string;
  public name: string;
  public color: string | null;
  public toJSON = this.serializeToObject();

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
