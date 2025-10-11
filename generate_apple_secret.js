const jwt = require('jsonwebtoken');
const fs = require('fs');

// Fill these in with your Apple credentials
const KEY_ID = '3SATCA4BL3';  // From Apple Developer Console
const TEAM_ID = 'V6VNWZWG64';  // Your 10-char Team ID
const CLIENT_ID = 'com.hitquote.auth';  // Your Service ID
const KEY_FILE = './AuthKey_3SATCA4BL3.p8';  // Path to your .p8 file

// Read the private key
const privateKey = fs.readFileSync(KEY_FILE, 'utf8');

// Generate JWT (valid for 6 months)
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: TEAM_ID,
  subject: CLIENT_ID,
  keyid: KEY_ID
});

console.log('\n=== Apple Client Secret (JWT) ===\n');
console.log(token);
console.log('\n=================================\n');
console.log('Copy this token and paste it into Supabase > Authentication > Providers > Apple > Secret Key');
console.log('\nNote: This token expires in 6 months. You will need to regenerate it.');
