import { IRepository } from "@models/repositories/IRepository";
import { Tag } from "@models/Tag";
import { Task } from "@models/Task";

export interface ITagsRepository extends IRepository<Tag, string> {
  create(tag: Tag): void;

  read(tagId: string): Tag | null;

  readAll(): Tag[];

  update(tag: Tag): void;

  delete(tag: Tag): void;

  getTaskTags(task: Task): Tag[];
}
