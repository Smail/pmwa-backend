import { IRepository } from "@models/IRepository";
import { User } from "@models/User";

export interface IUserRepository extends IRepository<User, string> {
  create(user: User): void;

  read(userId: string): User;

  update(user: User): void;

  delete(user: User): void;
}
