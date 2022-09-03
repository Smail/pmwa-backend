import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";

export function requireAuthenticatedUser(req, res, next) {
  const username = req.accessTokenContent.username;
  const user = Model.userRepository.read(req.uuid);

  if (username == null) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, "No username in the access token"));
  if (user.username !== username)
    throw new Error(`Username mismatch. Expected username "${user.username}" in token, but got "${username}"`);

  // Token does not contain a username, which is really weird, but is theoretically possible,
  // but *currently* not done by us.
  if (!username) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, "No username in the access token"));
  // If the user is null, then it was deleted between the creation of the token and now.
  if (!user) return next(createError(StatusCodes.GONE, "User does not exist"));

  req.user = user;
  next();
}
