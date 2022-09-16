import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { requireAuthenticatedUser } from "@middleware/requireAuthenticatedUser";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { User } from "@models/User";
import { AUTH_LEVEL_PRIVATE, AUTH_LEVEL_PUBLIC } from "@middleware/setAuthLevel";

export const get_users = (req, res) => {
  res.send(Model.userRepository.readAll().map(user => user.public()));
};

export const get_user = (req, res, next) => {
  const username: string = req.params.username;
  if (username == null) return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "No username is URL parameters"));
  if (!User.isValidUsername(username)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid username"));
  const user = Model.userRepository.findUsername(username);
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "Username not found"));

  if (req.authLevel === AUTH_LEVEL_PRIVATE) {
    try {
      requireAccessToken(req, res, function (err) {
        if (err != null) throw err;

        requireAuthenticatedUser(req, res, function (err) {
          if (err != null) throw err;
          if (req.user.username !== user.username || req.user.id !== user.id) {
            res.send({ ...user.public(), isPrivate: false });
          }
          res.send({ ...req.user.serializeToObject(), isPrivate: true });
        });
      });
    } catch (error) {
      return next(error);
    }
  } else if (req.authLevel === AUTH_LEVEL_PUBLIC) {
    // Send a public version of the user object, that doesn't contain sensitive information
    res.send({ ...user.public(), isPrivate: false });
  } else {
    throw createError(StatusCodes.INTERNAL_SERVER_ERROR, `Unknown auth level: ${req.authLevel}`);
  }
};

export const update_user = (req: {
  body: { username?: string; displayName?: string, firstName?: string; lastName?: string; email?: string; password?: string; };
  params: { username: string }; accessTokenContent: { userId: string }
}, res, next) => {
  const { username, displayName, firstName, lastName, email, password } = req.body;
  const userId = req.accessTokenContent.userId;
  if (!User.isValidId(userId)) return next(createError(StatusCodes.BAD_REQUEST, `Invalid argument: userId = ${userId}`));

  const user = Model.userRepository.read(userId);
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User ID not found"));
  if (user.id !== userId) return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "User ID mismatch"));
  if (user.username != req.params.username) {
    return next(createError(StatusCodes.BAD_REQUEST,
      "Mismatch: Username obtained via the user ID doesn't match the URL parameter"));
  }

  if (username) {
    if (!User.isValidUsername(username)) return next(createError(StatusCodes.BAD_REQUEST, `Invalid argument: username = ${username}`));
    user.username = username;
  }
  if (displayName) {
    if (!User.isValidDisplayName(displayName)) return next(createError(StatusCodes.BAD_REQUEST, `Invalid argument: displayName = ${displayName}`));
    user.displayName = displayName;
  }
  if (firstName) {
    if (!User.isValidNaturalName(firstName)) return next(createError(StatusCodes.BAD_REQUEST, `Invalid argument: firstName = ${firstName}`));
    user.firstName = firstName;
  }
  if (lastName) {
    if (!User.isValidNaturalName(lastName)) return next(createError(StatusCodes.BAD_REQUEST, `Invalid argument: lastName = ${lastName}`));
    user.lastName = lastName;
  }
  if (email) {
    if (!User.isValidEmail(email)) return next(createError(StatusCodes.BAD_REQUEST, `Invalid argument: email = ${email}`));
    user.email = email;
  }
  if (password) {
    if (!User.isValidPassword(password)) return next(createError(StatusCodes.BAD_REQUEST, `Invalid argument: password`));
    user.password = password;
  }

  Model.userRepository.update(user);
  res.sendStatus(StatusCodes.NO_CONTENT);
};
