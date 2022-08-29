import { StatusCodes } from "http-status-codes";
import { getUserFromUsername } from "../Model";
import jwt from 'jsonwebtoken';
import createError from "http-errors";

function decodeAccessToken(accessToken) {
  return jwt.verify(accessToken, process.env.ACCESS_TOKEN_PASSPHRASE);
}

function decodeRefreshToken(refreshToken) {
  return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PASSPHRASE);
}

function requireAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader == null) return next(createError(StatusCodes.UNAUTHORIZED, 'Missing Authorization header'));

  const authHeaderComponents = authHeader.split(' ').map((str) => str.trim());
  if (authHeaderComponents.length !== 2) return next(createError(StatusCodes.BAD_REQUEST, 'Unknown Authorization header syntax'));
  if (authHeaderComponents[0] !== 'Bearer') return next(createError(StatusCodes.BAD_REQUEST, `Expected 'Bearer' got ${authHeaderComponents[0]}`));

  try {
    const accessToken = authHeaderComponents[1];
    req.accessTokenContent = decodeAccessToken(accessToken);
  } catch (error) {
    // Rethrow possible errors like "jwt expired" as a NetworkError with a proper HTTP code, i.e., not simply 500.
    const code = (error instanceof jwt.JsonWebTokenError) ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR;
    return next(createError(code, error.message));
  }

  next();
}

function loadAuthenticatedUser(req, res, next) {
  const accessTokenContent = req.accessTokenContent;
  const username = accessTokenContent.username;
  const user = getUserFromUsername(username);

  // Token does not contain a username, which is really weird, but is theoretically possible,
  // but *currently* not done by us.
  if (!username) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, 'No username in the access token'));
  // If the user is null, then it was deleted between the creation of the token and now.
  if (!user) return next(createError(StatusCodes.GONE, 'User does not exist'));

  req.user = user;
  next();
}

export { requireAccessToken, loadAuthenticatedUser, decodeRefreshToken };
