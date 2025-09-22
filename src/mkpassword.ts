// hash-password.ts
import bcrypt from 'bcrypt';

const password = 'mypassword'; // choose your seed password
const saltRounds = 12;

bcrypt.hash(password, saltRounds).then(hash => {
  console.log('Hashed password:', hash);
});
