import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { decodeRefreshToken } from "../util/jwt/decodeRefreshToken";
import { User } from "@models/User";

function createAccessAndRefreshToken(user) {
  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  return { accessToken, refreshToken };
}

export const sign_in_user = async (req, res, next) => {
  const { password } = req.body;
  if (password == null) return next(createError(StatusCodes.UNAUTHORIZED, "Missing password"));

  const user = Model.userRepository.read(req.uuid);
  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User does not exist"));
  if (!Model.userRepository.checkPassword(user, password, User.checkPassword))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password"));

  res.status(StatusCodes.CREATED).send(createAccessAndRefreshToken(user));
};

export const refresh_token = async (req, res, next) => {
  const { refreshToken } = req.body;
  const user = Model.userRepository.read(req.uuid);

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
