// Tự động nhận diện môi trường:
// - Chạy trên máy tính dev (localhost / 127.0.0.1) -> Gọi API Backend local cổng 3000
// - Chạy trên Vercel / Điện thoại di động / Máy khác -> Gọi API Backend Cloud Render
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

export const SERVER_BASE_URL = isLocalhost
  ? 'http://localhost:3000'
  : 'https://uel-space-api.onrender.com';

// Đường dẫn hình ảnh: Sử dụng đường dẫn tương đối '/images/' để hình ảnh luôn hiển thị 100%
// trên cả localhost, Vercel, điện thoại và mọi thiết bị mà không bị lỗi localhost:3000
export const SERVER_IMAGES_LINK = '/images/';

export const AUTH_GOOGLE_URL = `${SERVER_BASE_URL}/api/auth/google`;

// Cấu hình Google OAuth 2.0 Client ID (tạo tại Google Cloud Console -> Credentials)
// Người dùng có thể thay đổi trực tiếp tại đây hoặc thông qua giao diện nhập nhanh ở màn hình Đăng nhập.
export const GOOGLE_CLIENT_ID = '718641806689-j4k89ensl7t3l05iin3imj7c1ndbbepj.apps.googleusercontent.com';
