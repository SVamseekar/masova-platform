const bcrypt = require('bcryptjs');

const passwordHash = "$2a$10$eYaCwy36SCNIHzKvk.0fPuEBuQ0iUN2VfAnwuz07wz46rNcPYLwPa";
const testPasswords = [
    "Manager@123",
    "manager123",
    "Manager123",
    "MANAGER123"
];

console.log('Testing password verification:');
console.log('Hash:', passwordHash);
console.log('');

testPasswords.forEach(password => {
    const matches = bcrypt.compareSync(password, passwordHash);
    console.log(`Password: "${password}" -> ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
});
