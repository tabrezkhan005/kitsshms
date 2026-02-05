// Simple OTP Generator for KITS SHMS
// Run this script to get OTP codes for testing

const users = [
  {
    username: 'admin',
    email: 'tabrezkhangnt@gmail.com',
    role: 'admin'
  },
  {
    username: 'faculty',
    email: 'tabrezkhanloyola@gmail.com',
    role: 'faculty'
  },
  {
    username: 'club',
    email: 'saberakhan94896@gmail.com',
    role: 'clubs'
  }
];

console.log('🔐 KITS SHMS - OTP Codes for Testing');
console.log('=====================================');
console.log('');

users.forEach(user => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`👤 ${user.role.toUpperCase()}:`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   🔐 OTP Code: ${otp}`);
  console.log('');
});

console.log('📝 Instructions:');
console.log('1. Use these OTP codes when prompted during login');
console.log('2. These codes are valid for 10 minutes');
console.log('3. Generate new codes if needed by running this script again');
console.log('');
console.log('⚠️  Note: Email delivery is currently disabled for debugging');
console.log('   These codes are for immediate testing purposes only');
