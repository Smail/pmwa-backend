import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";

export function requireAuthenticatedUser(req, res, next) {
  if (req.accessTokenContent == null) {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR,
      "No access token content is attached to the request object. Please call requireAccessToken before."));
  }

  const userId = req.accessTokenContent.userId;
  if (userId == null) return next(createError(StatusCodes.BAD_REQUEST, "No user ID in access token"));

  const user = Model.userRepository.read(userId);
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User ID not found"));
  if (user.id !== userId) return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "Token ID mismatch"));

  req.user = user;
  next();
}
