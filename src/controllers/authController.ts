import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { User, UserBuilder } from "@models/User";
import { existsUsername, getUserFromUsername, users } from "../Model";
import { decodeRefreshToken } from "@middleware/auth";

function createAccessAndRefreshToken(user) {
  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  return { accessToken, refreshToken };
}

export const create_user = async (req, res, next) => {
  const { username, firstName, lastName, email, password, repeatedPassword } = req.body;

  for (const key of ["username", "firstName", "lastName", "email", "password", "repeatedPassword"]) {
    if (!req.body[key]) return next(createError(StatusCodes.BAD_REQUEST, `Missing key '${key}'`));
  }

  // TODO regex test for first and last name, i.e., no special characters like '@' in name.
  if (User.isValidEmail(email)) return next(createError(StatusCodes.BAD_REQUEST, 'Invalid email'));
  if (password !== repeatedPassword) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, "Passwords don't match"));
  if (User.isPasswordWeak(password)) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, 'Password is too weak'));
  if (existsUsername(username)) return next(createError(StatusCodes.CONFLICT, 'Username already exists'));

  // Create new user
  const user: User = new UserBuilder()
    .addUsername(username)
    .addFirstName(firstName)
    .addLastName(lastName)
    .addEmail(email)
    .addPassword(password)
    .build();

  users.push(user);
  res.status(StatusCodes.CREATED).send({ id: user.uuid });
}

export const sign_in_user = async (req, res, next) => {
  const { username, password } = req.body;
  const user = getUserFromUsername(username);

  if (username == null) return next(createError(StatusCodes.UNAUTHORIZED, 'Missing username'));
  if (password == null) return next(createError(StatusCodes.UNAUTHORIZED, 'Missing password'));
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, 'Username does not exist'));
  if (!await (user.verifyPassword(password))) return next(createError(StatusCodes.UNAUTHORIZED, 'Wrong password'));

  res.status(StatusCodes.CREATED).send(createAccessAndRefreshToken(user));
}

export const refresh_token = async (req, res, next) => {
  const { username, refreshToken } = req.body;
  const user = getUserFromUsername(username);

  if (username == null) return next(createError(StatusCodes.UNAUTHORIZED, 'Missing username'));
  if (refreshToken == null) return next(createError(StatusCodes.UNAUTHORIZED, 'Missing refresh token'));
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, 'Username does not exist'));
  if (!user.hasRefreshToken(refreshToken)) return next(createError(StatusCodes.FORBIDDEN, 'Unknown refresh token'));

  // Paranoia: This should always be false, since a user should have a token saved, that contains their username.
  const tokenContent = decodeRefreshToken(refreshToken);
  if (tokenContent.username.toLowerCase() !== user.username.toLowerCase()) {
    // This is a seriously dangerous error. Somehow another user got a token from a different user.
    // An attack might be happening here.
    return next(createError(StatusCodes.FORBIDDEN, 'Username in token payload does not match the requested username'));
  }

  // Remove used refresh token.
  if (!user.deleteRefreshToken(refreshToken)) {
    const errorMsg = `Refresh token for user ID ${user.uuid} could not be removed even though it exists.`;
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, errorMsg));
  }

  res.status(StatusCodes.CREATED).send(createAccessAndRefreshToken(user));
};
