const { assert } = require('console');

const users = [];

function getUserFromUsername(username) {
  assert(username, new Error('Username is null'));
  assert(typeof (username) === 'string', new Error('Username is not a string.'));
  return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

function existsUsername(username) {
  assert(username, new Error('Username is null'));
  return getUserFromUsername(username) != null;
}

module.exports = {
  users, getUserFromUsername, existsUsername
};
