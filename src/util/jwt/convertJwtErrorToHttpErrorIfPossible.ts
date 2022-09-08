import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import jwt from "jsonwebtoken";

export function convertJwtErrorToHttpErrorIfPossible(error): Error {
  if (error instanceof jwt.JsonWebTokenError) {
    let errMsg = error.message;

    // Lowercase error messages are annoying
    if (errMsg.toLowerCase() === "invalid token") {
      errMsg = "Invalid token";
    } else if (errMsg.toLowerCase() === "jwt expired") {
      errMsg = "JWT expired";
    } else if (errMsg.toLowerCase() === "invalid signature") {
      errMsg = "Invalid signature";
    }

    // Rethrow possible errors like "jwt expired" as a NetworkError with a proper HTTP code, i.e., not simply 500.
    return createError(StatusCodes.FORBIDDEN, errMsg);
  }
  return error;
}
