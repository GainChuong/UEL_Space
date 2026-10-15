# Kế hoạch Triển khai: Nâng cấp AI Chatbot UEL Space với Gemini API & Lưu lịch sử Hội thoại

## Mục tiêu (Goal)
Tích hợp Google Gemini AI (Interactions API / generateContent) cho Chatbot UEL Space với cấu trúc đầu ra JSON Schema ổn định, lưu lịch sử hội thoại trên MongoDB Atlas & LocalStorage, tự động gợi ý không gian thực tế (RAG Context) và hỗ trợ đặt phòng 1 chạm kèm Fallback thông minh.

---

## Danh mục nhiệm vụ (Task Breakdown)

- [x] **Task 1: Cấu hình Backend Environment & Gemini Service**
  - Thêm `GEMINI_API_KEY` vào `my-server/.env`.
  - Xây dựng `my-server/src/modules/chatbot/gemini.service.js` gọi Gemini API (hỗ trợ cả Interactions API và GenerateContent API) kèm Structured Output JSON Schema và Local Heuristics Fallback khi gặp lỗi (403, 429, timeout).

- [x] **Task 2: Xây dựng Module Chatbot Backend (Router, Repository & Controller)**
  - Tạo `my-server/src/modules/chatbot/chatbot.repository.js` lưu trữ lịch sử hội thoại trong MongoDB collection `chat_sessions`.
  - Tạo `my-server/src/modules/chatbot/chatbot.routes.js` cung cấp:
    - `POST /api/chatbot/message`: Tiếp nhận tin nhắn, nạp Context dữ liệu phòng đang trống từ MongoDB (RAG), gọi Gemini và lưu lịch sử.
    - `GET /api/chatbot/history`: Lấy lịch sử hội thoại theo `sessionId` hoặc `userId`.
    - `DELETE /api/chatbot/history`: Xóa lịch sử hội thoại của phiên.
  - Đăng ký route `/api/chatbot` vào `my-server/index.js`.

- [x] **Task 3: Nâng cấp Client Chatbot Service (Angular 22)**
  - Cập nhật `frontend/src/app/services/chatbot.service.ts`:
    - Quản lý `sessionId` tự sinh hoặc đồng bộ với tài khoản đăng nhập.
    - Gửi request đến `POST /api/chatbot/message` của backend.
    - Nhận Structured Output JSON từ Gemini: `replyText`, `intent`, `suggestedSpaces`, `bookingAction`, `quickActions`.
    - Tự động lưu cache LocalStorage phòng khi mất kết nối mạng.

- [x] **Task 4: Hoàn thiện Giao diện Chatbot & Tác vụ Thông minh (UI & Interaction)**
  - Cập nhật `frontend/src/app/components/common/chatbot/chatbot.ts` & `chatbot.html`:
    - Hiển thị lịch sử chat đa phiên, nút "Xóa lịch sử", nút "Tải lại phiên cũ".
    - Render Rich Cards không gian được Gemini đề xuất (sức chứa, giá, tiện ích).
    - Hỗ trợ nút "Đặt nhanh 1 chạm" mở Modal MoMo / Tiền mặt và tạo link Google Calendar tự động.
    - Thêm badge hiển thị trạng thái động: `✨ Powered by Gemini AI` (hoặc `⚡ Local Fallback Mode` khi API offline).

- [x] **Task 5: Kiểm thử Toàn diện & Xác thực (Verification)**
  - Kiểm tra gọi API Backend với Gemini API Key.
  - Xác nhận cơ chế Fallback hoạt động trơn tru khi key bị lỗi/chặn.
  - Kiểm tra lưu và nạp lại lịch sử trò chuyện trên MongoDB Atlas.
  - Xác thực hiển thị thẻ phòng, đặt chỗ và đồng bộ Google Calendar.
