import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { requireAuthenticatedUser } from "@middleware/requireAuthenticatedUser";
import { requireAccessToken } from "@middleware/requireAccessToken";
import { User } from "@models/User";
import { AUTH_LEVEL_PRIVATE, AUTH_LEVEL_PUBLIC } from "@middleware/setAuthLevel";

export const get_users = (req, res) => {
  res.send(Model.userRepository.readAll().map(user => user.public()));
}

export const get_user = (req, res, next) => {
  if (req.authLevel === AUTH_LEVEL_PRIVATE) {
    requireAccessToken(req, res, next);
    requireAuthenticatedUser(req, res, next);

    const user: User = req.user;
    if (user.id !== req.params.userId) {
      return createError(StatusCodes.BAD_REQUEST,
        "ID mismatch: The ID contained in the access token is not the same as the one provided in the URL");
    }

    res.send(user.serializeToObject());
  } else if (req.authLevel === AUTH_LEVEL_PUBLIC) {
    const userId = req.params.userId;
    if (userId == null) return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "No user ID in URL parameters"));
    if (!User.isValidId(userId)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid ID syntax"));

    const user = Model.userRepository.read(userId);
    if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

    // Send a public version of the user object, that doesn't contain sensitive information
    res.send(user.public());
  } else {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, `Unknown auth level: ${req.authLevel}`));
  }
};

export const update_user = (req, res, next) => {
  const { username, firstName, lastName, email, password } = req.body;
  const userId = req.accessTokenContent.userId;
  const user = Model.userRepository.read(userId);
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User ID not found"));
  if (user.id !== userId) return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "Token ID mismatch"));

  // TODO validity checks
  if (username) user.username = username;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email;
  if (password) user.password = password;

  Model.userRepository.update(user);
  res.sendStatus(StatusCodes.OK);
};
