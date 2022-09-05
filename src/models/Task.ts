import { ISerializable } from "@models/repositories/ISerializable";
import { v4 as uuidv4 } from "uuid";

export class Task implements ISerializable {
  // TODO default values
  public id: string;
  public userId: string;
  public name: string;
  public content: string;
  public isDone: boolean;

  public assignUniqueId(): void {
    this.id = uuidv4();
  }

  public toJSON(): object {
    return this.serializeToObject();
  }

  // TODO assign only if not null else default value
  public deserializeFromObject({ taskId, userId, name, content, isDone }): void {
    // TODO loop over typescript class object https://stackoverflow.com/a/66645452/9258134
    this.id = taskId;
    this.userId = userId;
    this.name = name;
    this.content = content;
    this.isDone = isDone;
  }

  public serializeToObject(): object {
    return { taskId: this.id, userId: this.userId, name: this.name, content: this.content, isDone: this.isDone };
  }
}
