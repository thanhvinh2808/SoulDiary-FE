const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const os = require('os');

// Đường dẫn mặc định tới debug.keystore
const keystorePath = path.join(os.homedir(), '.android', 'debug.keystore');

console.log('Checking keystore at:', keystorePath);

if (fs.existsSync(keystorePath)) {
  const buffer = fs.readFileSync(keystorePath);
  
  // SHA-1
  const hash = crypto.createHash('sha1');
  hash.update(buffer);
  const sha1 = hash.digest('hex').toUpperCase().match(/.{1,2}/g).join(':');

  console.log('\n✅ YOUR SHA-1 FINGERPRINT:');
  console.log(sha1);
  console.log('\n(Copy mã này dán vào Google Cloud Console phần Android Client ID)');
  
  // Facebook Key Hash
  const hash2 = crypto.createHash('sha1');
  hash2.update(buffer);
  const base64 = hash2.digest('base64');
  console.log('\n✅ YOUR FACEBOOK KEY HASH:');
  console.log(base64);
  console.log('\n(Copy mã này dán vào Facebook Developers phần Key Hashes)');

} else {
  console.log('❌ Error: debug.keystore not found!');
  console.log('Bạn cần chạy dự án Android ít nhất một lần để file này được tạo ra.');
  console.log('Hãy thử chạy lệnh: npx expo run:android (nếu dùng bare workflow) hoặc cài Android Studio.');
}
