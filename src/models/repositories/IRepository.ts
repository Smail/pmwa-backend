import { ISerializable } from "@models/repositories/ISerializable";

export interface IRepository<T extends ISerializable, K> {
  create(value: T): void;

  read(key: K): T;

  readAll(): T[];

  update(value: T): void;

  delete(value: T): void;
}
