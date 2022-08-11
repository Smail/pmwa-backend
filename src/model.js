const { assert } = require('console');
const { User } = require('./User');

const users = [];
// Observe push method on users array.
// Automatically serialize users array.
users.push = function () {
  // Check if the elements pushed are of type User.
  for (const key in arguments) {
    const value = arguments[key];

    if (!(value instanceof User)) {
      throw new Error('Element pushed into users array is not of Type User. ' + JSON.stringify(value));
    }

    if (users.filter(user => user.username.toLowerCase() === value.username.toLowerCase()).length > 0) {
      throw new Error('Username already exists');
    }
  }

  Array.prototype.push.apply(this, arguments);
};

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
