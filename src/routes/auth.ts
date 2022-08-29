import express from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { NetworkError } from '@utils/errors/NetworkError';
import { users, getUserFromUsername, existsUsername } from 'Model';
import { User, UserBuilder } from '@models/User';

const router = express.Router();

function createAccessAndRefreshToken(user) {
  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  return { accessToken, refreshToken };
}

function decodeToken(token, encKey) {
  try {
    return jwt.verify(token, encKey);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new NetworkError('jwt: ' + error.message, StatusCodes.BAD_REQUEST);
    } else {
      throw error;
    }
  }
}

function decodeAccessToken(accessToken) {
  return decodeToken(accessToken, process.env.ACCESS_TOKEN_PASSPHRASE);
}

function decodeRefreshToken(refreshToken) {
  return decodeToken(refreshToken, process.env.REFRESH_TOKEN_PASSPHRASE);
}

function requireAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader == null) {
    throw new NetworkError('Missing Authorization header.', StatusCodes.UNAUTHORIZED);
  }

  const authHeaderComponents = authHeader.split(' ').map((str) => str.trim());
  if (authHeaderComponents.length !== 2) {
    throw new NetworkError('Unknown Authorization header syntax.', StatusCodes.BAD_REQUEST);
  } else if (authHeaderComponents[0] !== 'Bearer') {
    throw new NetworkError(`Expected 'Bearer' got ${authHeaderComponents[0]}.`, StatusCodes.BAD_REQUEST);
  }

  const accessToken = authHeaderComponents[1];
  let tokenContent;

  // Rethrow possible errors like "jwt expired" as a NetworkError with a proper HTTP code,
  // i.e., not simply 500.
  try {
    tokenContent = decodeAccessToken(accessToken);
    req.accessTokenContent = tokenContent;
  } catch (error) {
    throw new NetworkError(error.message, StatusCodes.UNAUTHORIZED);
  }

  next();
}

function loadAuthenticatedUser(req, res, next) {
  const accessTokenContent = req.accessTokenContent;
  const username = accessTokenContent.username;

  // Token does not contain a username, which is really weird, but is theoretically possible,
  // but *currently* not done by us.
  if (!username) throw new NetworkError('There is no username specified in the access token :O', StatusCodes.UNPROCESSABLE_ENTITY);

  const user = getUserFromUsername(username);

  // If the user is null, then it was deleted between the issument of the token and now. 
  if (!user) throw new NetworkError('User does not exist anymore.', StatusCodes.GONE);

  req.user = user;
  next();
}

function existKeysThrow(object, keys) {
  for (const key of keys) {
    if (!object[key]) {
      throw new NetworkError(`Missing key '${key}'.`, StatusCodes.BAD_REQUEST);
    }
  }
}

function isValidSignUpUserObject(req, res, next) {
  // Checks if all required keys exist or throws an error.
  existKeysThrow(req.body, ["username", "firstName", "lastName", "email", "password", "repeatedPassword"]);
  next();
}

function validateEmail(req, res, next) {
  const user = req.body;

  // User and user.email should have been already checked for null by previous middleware.
  if (user == null) {
    throw new Error('User is null');
  } else if (user.email == null) {
    throw new Error('User email is null');
  } else if (!User.isValidEmail(user.email)) {
    throw new NetworkError('Invalid email', StatusCodes.BAD_REQUEST);
  }

  next();
}

// Create a new user
router.post('/signup', isValidSignUpUserObject, validateEmail, async (req, res, next) => {
  try {
    // User object
    const { username, firstName, lastName, email, password, repeatedPassword } = req.body;

    // TODO regex test for first and last name, i.e., no special characters like '@' in name.
    if (password !== repeatedPassword) {
      throw new NetworkError("Password and repeated Password don't match", StatusCodes.UNPROCESSABLE_ENTITY);
    }
    if (User.isPasswordWeak(password)) {
      throw new NetworkError("Password is too weak", StatusCodes.BAD_REQUEST);
    }
    if (existsUsername(username)) {
      throw new NetworkError('Username already exists', StatusCodes.CONFLICT);
    }

    // Create new user
    const user: User = new UserBuilder()
      .addUsername(username)
      .addFirstName(firstName)
      .addLastName(lastName)
      .addEmail(email)
      .addPassword(password)
      .build();

    users.push(user);
    res.status(StatusCodes.CREATED).send({ id: user.uuid });
  } catch (error) {
    next(error);
  }
});

router.post('/signin', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (username == null) throw new NetworkError('Missing username', StatusCodes.UNPROCESSABLE_ENTITY);
    if (password == null) throw new NetworkError('Missing password', StatusCodes.UNPROCESSABLE_ENTITY);

    const user = getUserFromUsername(username);
    if (user == null) throw new NetworkError('Username does not exist', StatusCodes.UNAUTHORIZED);

    // Returns a promise. Let it do its thing in the background.
    const isPasswordVerified = user.verifyPassword(password);
    if (!await isPasswordVerified) throw new NetworkError('Wrong password', StatusCodes.UNAUTHORIZED);

    // Issue tokens.
    const tokens = createAccessAndRefreshToken(user);
    res.status(StatusCodes.OK).send(tokens);
  } catch (error) {
    next(error);
  }
});

// Issue new access and refresh token with a provided refresh token.
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { username, refreshToken } = req.body;

    if (username == null) throw new NetworkError('Missing username', StatusCodes.UNPROCESSABLE_ENTITY);
    if (refreshToken == null) throw new NetworkError('Missing refresh token', StatusCodes.UNPROCESSABLE_ENTITY);

    const user = getUserFromUsername(username);

    if (user == null) throw new NetworkError('Username does not exist', StatusCodes.NOT_FOUND);
    if (user.numberOfRefreshTokens === 0) {
      throw new NetworkError('User does not own any refresh tokens', StatusCodes.NOT_FOUND);
    }

    const tokenContent = decodeRefreshToken(refreshToken);

    // Does the user even own this token?
    if (!user.hasRefreshToken(refreshToken)) {
      throw new NetworkError('Unknown refresh token.', StatusCodes.NOT_FOUND);
    }

    // Paranoia: This should always be false, because a user should have a token saved,
    // that contains a different username.
    // Make sure if username is token matches the requested username
    if (tokenContent.username.toLowerCase() !== user.username.toLowerCase()) {
      console.error(
        `Username in token payload does not match the requested username.
        This SHOULD absolutely NEVER happen here,
        because we previously checked if the user has the token in its refresh token list. 
        Since it returned true, an injection attack MUST be happening here!
        Exiting process...`.replace('\n', ' '));
      // Fatally exit the server, because something horrible is going on here.
      process.exit(1);
    }

    // Remove used refresh token.
    if (!user.deleteRefreshToken(refreshToken)) {
      throw new NetworkError(
        `SERIOUS BUG: Refresh token could not be removed (id = ${user.uuid}) even though it exists.`,
        StatusCodes.INTERNAL_SERVER_ERROR);
    }

    // Issue new tokens
    const tokens = createAccessAndRefreshToken(user);
    res.status(StatusCodes.OK).send(tokens);
  } catch (error) {
    next(error);
  }
});

export { router, requireAccessToken, loadAuthenticatedUser };
