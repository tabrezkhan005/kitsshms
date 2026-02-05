/**
 * Password Hash Generator Script
 * Run this script to generate bcrypt password hashes for users
 *
 * Usage: node scripts/generate-password-hash.js <password>
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'Admin@123';

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n🔐 Password Hash Generator');
console.log('========================');
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log('\nSQL to update user password:');
console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'your-email@example.com';`);
console.log('\nSQL to insert new user:');
console.log(`INSERT INTO users (email, username, password_hash, role, is_email_verified, is_active) VALUES ('email@example.com', 'username', '${hash}', 'faculty', true, true);`);
console.log('');
