// Local modules
const { users, getUserFromUsername, existsUsername } = require('../src/model');
const { User } = require('./User');
// Load config
require('dotenv').config();

// Add faker.js data if in debug mode
if (process.env.DEBUG) {
  const usersTmp = [];
  (async () => {
    const { faker } = require('@faker-js/faker/locale/en_US');

    faker.seed(123);

    for (let i = 0; i < 20; i++) {
      const randomName = faker.name.findName(); // Jane Doe
      const firstName = randomName.split(' ')[0]; // Jane
      const lastName = randomName.split(' ')[1]; // Doe
      const username = faker.internet.userName(firstName, lastName);
      const email = faker.internet.email();
      const password = faker.internet.password(15);

      usersTmp.push(new User(username, firstName, lastName, email, password));
    }

    usersTmp.push(new User('smail', 'Smail', 'Mustermann', 'smail@example.com', 'Smail1234'));
    
    // Add created mock elements to users array
    for (const user of usersTmp) {
      const username = user.username.toLowerCase();

      // Only add unique usernames
      if (users.find(u => u.username.toLowerCase() === username) == null) {
        users.push(user);
      }
    }
  })();
}
