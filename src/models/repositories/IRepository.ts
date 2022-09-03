import { ISerializable } from "@models/repositories/ISerializable";

export interface IRepository<T extends ISerializable, K> {
  create(value: T): void;

  read(key: K): T;

  readAll(key: K): T[];

  update(value: T): void;

  delete(value: T): void;
}
