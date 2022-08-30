import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Model } from "../Model";
import { User } from "@models/User";
import { v4 as uuidv4 } from "uuid";

export const get_user = (req, res, next) => {
  res.send(Model.userRepository.read(req.uuid).serializeToObject());
};

export const create_user = async (req, res, next) => {
  const { username, firstName, lastName, email, password } = req.body;

  for (const key of ["username", "firstName", "lastName", "email", "password"]) {
    if (!req.body[key]) return next(createError(StatusCodes.BAD_REQUEST, `Missing key '${key}'`));
  }

  // TODO regex test for first and last name, i.e., no special characters like '@' in name.
  if (!User.isValidEmail(email)) return next(createError(StatusCodes.BAD_REQUEST, "Invalid email"));
  if (!User.isValidPassword(password)) return next(createError(StatusCodes.UNPROCESSABLE_ENTITY, "Invalid password"));
  if (Model.userRepository.findUsername(username)) return next(createError(StatusCodes.CONFLICT, "Username already exists"));

  const user = new User();

  user.id = uuidv4();
  user.username = username;
  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;
  user.password = password;

  Model.userRepository.create(user);
  res.status(StatusCodes.CREATED).send({ id: user.id });
};

export const update_user = (req, res, next) => {
  const { username, firstName, lastName, email, password } = req.body;
  const user = Model.userRepository.read(req.uuid);

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
  res.status(StatusCodes.OK).send(user.displayName);
};
