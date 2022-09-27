import { IRepository } from "@models/repositories/IRepository";
import { JWTToken } from "@models/JWTToken";
import { User } from "@models/User";

export interface IUserTokensRepository extends IRepository<JWTToken, string> {
  readonly user: User;

  create(token: JWTToken): void;

  read(tokenId: string): JWTToken | null;

  readAll(): JWTToken[];

  update(token: JWTToken): void;

  delete(token: JWTToken): void;
}
