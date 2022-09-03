import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";

export function requireAuthenticatedUser(req, res, next) {
  const username = req.accessTokenContent.username;
  const user = Model.userRepository.read(req.uuid);

  // Token does not contain a username, which is really weird, but is theoretically possible,
  // but *currently* not done by us.
  if (username == null) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, "Missing username in access token"));
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User ID not found"));
  if (user.username !== username) {
    throw new Error(`Username mismatch. Expected username "${user.username}" in token, but got "${username}"`);
  }

  req.user = user;
  next();
}
