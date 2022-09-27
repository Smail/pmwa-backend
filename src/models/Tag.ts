import { ISerializable } from "@models/repositories/ISerializable";
import { v4 as uuidv4, validate as isValidUuid } from "uuid";
import { ITagRecord } from "@models/ITagRecord";
import { Model } from "../Model";

export class Tag implements ISerializable {
  public tagId: string = uuidv4();
  public name: string;
  public color: string | null;

  public static throwIfInvalid({ tagId, name, color }: ITagRecord): void {
    if (!Tag.isValidId(tagId)) throw new Error(`Invalid argument: tagId = ${tagId}`);
    if (name == null || typeof name !== "string") throw new Error(`Invalid argument: name = ${name}`);
    if (color != null && typeof color !== "string") throw new Error(`Invalid argument: color = ${color}`);
  }

  public static isValidId(tagId: string): boolean {
    return isValidUuid(tagId);
  }

  public deserializeFromObject({ tagId, name, color }: ITagRecord): void {
    Tag.throwIfInvalid({ tagId, name, color });
    this.tagId = tagId;
    this.name = name;
    this.color = (typeof color === "string") ? color : null;
  }

  public serializeToObject(): ITagRecord {
    const o = { tagId: this.tagId, name: this.name, color: this.color };
    Tag.throwIfInvalid(o);
    return o;
  }

  public save(): void {
    Model.tagRepository.create(this);
  }
}
