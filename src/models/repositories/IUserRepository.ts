import { IRepository } from "@models/repositories/IRepository";
import { User } from "@models/User";
import { IRefreshTokenRepository } from "@models/repositories/IRefreshTokenRepository";
import { Token } from "@models/Token";

export interface IUserRepository extends IRepository<User, string> {
  create(user: User): void;

  read(userId: string): User;

  update(user: User): void;

  delete(user: User): void;

  findUsername(username: string): User | null;

  checkPassword(user: User, password: string, comparePasswords: (password, passwordHash) => boolean): boolean;

  getTokens(user: User, refreshTokenRepository: IRefreshTokenRepository): Token[];
}
