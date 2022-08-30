import { ISerializable } from "@models/ISerializable";

export interface IRepository<T extends ISerializable, K> {
  create(value: T): void;

  read(key: K): T;

  update(value: T): void;

  delete(value: T): void;
}
