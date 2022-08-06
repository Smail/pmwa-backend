// Local modules
const { users, getUserFromUsername, existsUsername } = require('../src/app-model');
const { User } = require('./User');
// Load config
require('dotenv').config();

// Add faker.js data if in debug mode
if (process.env.DEBUG) {  
  (async () => {
    const { faker } = require('@faker-js/faker/locale/en_US');

    async function addFakeData() {
      faker.seed(123);

      for (let i = 0; i < 20; i++) {
        const randomName = faker.name.findName(); // Jane Doe
        const firstName = randomName.split(' ')[0]; // Jane
        const lastName = randomName.split(' ')[1]; // Doe
        const username = faker.internet.userName(firstName, lastName);
        const email = faker.internet.email();
        const password = faker.internet.password(15);
        users.push(new User(username, firstName, lastName, email, password));
      }

      users.push(new User('smail', 'Smail', 'Mustermann', 'smail@example.com', 'Smail1234'));
    }

    addFakeData();
  })();
}
