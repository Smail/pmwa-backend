import { IRepository } from "@models/repositories/IRepository";
import { User } from "@models/User";

export interface IUserRepository extends IRepository<User, string> {
  create(user: User): void;

  read(userId: string): User | null;

  readAll(): User[];

  update(user: User): void;

  delete(user: User): void;

  findUsername(username: string): User | null;

  checkPassword(user: User, password: string, comparePasswords: (password, passwordHash) => boolean): boolean;
}
