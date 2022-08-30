import jwt from "jsonwebtoken";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { getUserFromUsername } from "../Model";

function decodeRefreshToken(refreshToken) {
  return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PASSPHRASE);
}

function loadAuthenticatedUser(req, res, next) {
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

export { loadAuthenticatedUser, decodeRefreshToken };
