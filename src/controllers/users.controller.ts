import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { User } from "@models/User";
import { v4 as uuidv4 } from "uuid";

export const get_user = (req, res, next) => {
  res.send(Model.userRepository.read(req.uuid)?.serializeToObject());
};

export const update_user = (req, res, next) => {
  const { username, firstName, lastName, email, password } = req.body;
  const user = Model.userRepository.read(req.uuid);

  if (user == null) return next(createError(StatusCodes.NOT_FOUND, "User ID not found"));

  // TODO validity checks
  if (username) user.username = username;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email;
  if (password) user.password = password;

  Model.userRepository.update(user);
  res.sendStatus(StatusCodes.OK);
};

export const get_display_name = (req, res, next) => {
  const user = Model.userRepository.read(req.uuid);
  res.status(StatusCodes.OK).send(user?.displayName);
};
