import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { getUserFromUsername } from "../Model";

export function requireAuthenticatedUser(req, res, next) {
  const accessTokenContent = req.accessTokenContent;
  const username = accessTokenContent.username;
  const user = getUserFromUsername(username);

  // Token does not contain a username, which is really weird, but is theoretically possible,
  // but *currently* not done by us.
  if (!username) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, "No username in the access token"));
  // If the user is null, then it was deleted between the creation of the token and now.
  if (!user) return next(createError(StatusCodes.GONE, "User does not exist"));

  req.user = user;
  next();
}
