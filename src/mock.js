// Local modules
const { users } = require('../src/model');
const { UserBuilder } = require('./User');
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

      const user = new UserBuilder()
        .addUsername(username)
        .addFirstName(firstName)
        .addLastName(lastName)
        .addEmail(faker.internet.email())
        .addPassword(faker.internet.password(15))
        .build();
      usersTmp.push(user);
    }

    const smail = new UserBuilder()
      .addUsername('smail')
      .addFirstName('Smail')
      .addLastName('Mustermann')
      .addEmail('smail@example.com')
      .addPassword('Smail1234')
      .build();
    console.log(`Username: ${smail.username}`);
    console.log(`UUID: ${smail.uuid}`);
    console.log(`First name: ${smail.firstName}`);
    console.log(`Last name: ${smail.lastName}`);
    console.log(`Access Token: ${smail.createAccessToken()}`);
    console.log(`Refresh Token: ${smail.createRefreshToken()}`);
    usersTmp.push(smail);

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
