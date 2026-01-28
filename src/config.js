import { Platform } from 'react-native';

// Tự động chọn địa chỉ API dựa trên nền tảng thiết bị
// - Android Emulator: 10.0.2.2
// - iOS / Web / Khác: localhost
const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  }
  // Nếu bạn test trên thiết bị thật (điện thoại thật), hãy thay 'localhost' bằng IP LAN của máy tính (vd: '192.168.1.x')
  return 'http://localhost:3000/api/v1';
};

export const API_URL = getApiUrl();
