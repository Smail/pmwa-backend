import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { User } from "@models/User";
import { v4 as uuidV4 } from "uuid";
import { UserRefreshTokensRepositorySQLite } from "@models/repositories/sqlite/UserRefreshTokensRepositorySQLite";
import { JWTToken } from "@models/JWTToken";
import { convertJwtErrorToHttpErrorIfPossible } from "../util/jwt/convertJwtErrorToHttpErrorIfPossible";

function createAccessAndRefreshToken(user: User): { accessToken: string, refreshToken: string } {
  const accessToken: JWTToken = user.createAccessToken();
  const refreshToken: JWTToken = user.createRefreshToken();

  Model.refreshTokenRepository.create(refreshToken);
  new UserRefreshTokensRepositorySQLite(Model.db, user).create(refreshToken);

  return { accessToken: accessToken.encode(), refreshToken: refreshToken.encode() };
}

function createUser(req, next): User {
  const { username, firstName, lastName, email, password } = req.body;

  for (const key of ["username", "firstName", "lastName", "email", "password"]) {
    if (!req.body[key]) throw createError(StatusCodes.BAD_REQUEST, `Missing key '${key}'`);
  }

  // TODO regex test for first and last name, i.e., no special characters like '@' in name.
  if (!User.isValidEmail(email)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid email"));
  if (!User.isValidPassword(password)) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, "Invalid password"));
  if (Model.userRepository.findUsername(username) != null) {
    throw createError(StatusCodes.CONFLICT, "Username already exists");
  }

  const user = new User();

  user.id = uuidV4();
  user.username = username;
  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;
  user.password = password;

  Model.userRepository.create(user);

  return user;
}

export const sign_up_user = (req, res, next) => {
  try {
    const user = createUser(req, next);
    res.sendStatus(StatusCodes.CREATED);
  } catch (error) {
    next(error);
  }
};

export const sign_in_user = (req, res, next) => {
  const { username, password } = req.body;
  if (password == null) return next(createError(StatusCodes.BAD_REQUEST, "Missing password"));
  if (username == null) return next(createError(StatusCodes.BAD_REQUEST, "Missing username"));
  if (!User.isValidUsername(username)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid username"));

  const user = Model.userRepository.findUsername(username);
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User not found"));
  if (!Model.userRepository.checkPassword(user, password, User.checkPassword)) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password"));
  }

  res.status(StatusCodes.CREATED).send({ userId: user.id, ...createAccessAndRefreshToken(user) });
};

export const refresh_token = (req: { body: { refreshToken: string } }, res, next) => {
  const { refreshToken } = req.body;
  const passphrase = process.env.REFRESH_TOKEN_PASSPHRASE;
  if (refreshToken == null) return next(createError(StatusCodes.UNAUTHORIZED, "Missing refresh token"));
  if (passphrase == null) return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "Passphrase is null"));

  try {
    const token: JWTToken = JWTToken.decode(refreshToken, passphrase);
    const userId = token.userId;
    const user = Model.userRepository.read(userId);
    if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    if (token.grantType !== "refresh") return next(createError(StatusCodes.FORBIDDEN, "Invalid grant type"));

    // Check if token exists.
    const token2 = new UserRefreshTokensRepositorySQLite(Model.db, user).read(token.id);
    if (token2 == null) return next(createError(StatusCodes.NOT_FOUND, "Unknown refresh token"));

    // Remove used refresh token.
    Model.refreshTokenRepository.delete(token);

    // Create and return new tokens.
    res.status(StatusCodes.CREATED).send(createAccessAndRefreshToken(user));
  } catch (error) {
    return next(convertJwtErrorToHttpErrorIfPossible(error));
  }
};
