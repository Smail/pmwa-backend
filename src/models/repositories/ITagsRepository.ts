import { IRepository } from "@models/repositories/IRepository";
import { Tag } from "@models/Tag";

export interface ITagsRepository extends IRepository<Tag, string> {
  create(tag: Tag): void;

  read(tagId: string): Tag;

  readAll(tagId: string): Tag[];

  update(tag: Tag): void;

  delete(tag: Tag): void;
}
