import { IRepository } from "@models/IRepository";
import { Tag } from "@models/Tag";

export interface ITagsRepository extends IRepository<Tag, string> {
  create(tag: Tag): void;

  read(id: string): Tag;

  update(tag: Tag): void;

  delete(tag: Tag): void;
}
