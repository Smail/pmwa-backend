import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { decodeRefreshToken } from "../util/jwt/decodeRefreshToken";
import { User } from "@models/User";
import { v4 as uuidV4 } from "uuid";

function createAccessAndRefreshToken(user) {
  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  return { accessToken: accessToken.encoding, refreshToken: refreshToken.encoding };
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

export const sign_up_user = async (req, res, next) => {
  try {
    const user = createUser(req, next);
    console.log(user.id);
    res.status(StatusCodes.CREATED).send({ userId: user.id, ...createAccessAndRefreshToken(user) });
  } catch (error) {
    next(error);
  }
};

export const sign_in_user = async (req, res, next) => {
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

export const refresh_token = async (req, res, next) => {
  const { refreshToken } = req.body;
  const user = Model.userRepository.read(req.body.uuid);

  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User does not exist"));
  if (refreshToken == null) return next(createError(StatusCodes.UNAUTHORIZED, "Missing refresh token"));
  const tokens = Model.userRepository.getTokens(user, Model.refreshTokenRepository);
  if (!tokens.includes(refreshToken)) return next(createError(StatusCodes.FORBIDDEN, "Unknown refresh token"));

  // Paranoia: This should always be false, since a user should have a token saved, that contains their username.
  const tokenContent = decodeRefreshToken(refreshToken);
  if (tokenContent.username.toLowerCase() !== user.username.toLowerCase()) {
    // This is a seriously dangerous error. Somehow another user got a token from a different user.
    // An attack might be happening here.
    return next(createError(StatusCodes.FORBIDDEN, "Username in token payload does not match the requested username"));
  }

  // Remove used refresh token.
  Model.refreshTokenRepository.delete(refreshToken);

  res.status(StatusCodes.CREATED).send(createAccessAndRefreshToken(user));
};
