export const SERVER_BASE_URL = 'http://localhost:3000';
// Đường dẫn hình ảnh: Sử dụng đường dẫn tương đối '/images/' để hình ảnh luôn hiển thị 100%
// trên cả localhost, Vercel, điện thoại và mọi thiết bị mà không bị lỗi localhost:3000
export const SERVER_IMAGES_LINK = '/images/';
export const AUTH_GOOGLE_URL = `${SERVER_BASE_URL}/api/auth/google`;

// Cấu hình Google OAuth 2.0 Client ID (tạo tại Google Cloud Console -> Credentials)
// Người dùng có thể thay đổi trực tiếp tại đây hoặc thông qua giao diện nhập nhanh ở màn hình Đăng nhập.
export const GOOGLE_CLIENT_ID = '938164821613-demo.apps.googleusercontent.com';
