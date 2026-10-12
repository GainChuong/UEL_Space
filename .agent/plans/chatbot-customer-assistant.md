# Plan: Chatbot AI Customer Assistant

## Overview
Xây dựng Chatbot AI tại giao diện Customer giúp gợi ý không gian học tập/làm việc theo nhu cầu và hỗ trợ đặt chỗ tự động 1 chạm khi người dùng không có thời gian tìm kiếm thủ công.

## Kiến trúc
- `frontend/src/app/services/chatbot.service.ts`: Bộ máy NLP cục bộ phân tích tiếng Việt, chấm điểm xếp hạng phòng, quản lý tin nhắn và tạo đơn đặt nhanh.
- `frontend/src/app/components/common/chatbot/`: Widget Chatbot hiển thị trên toàn bộ các trang giao diện khách hàng.
- Tích hợp MoMo Sandbox, Google Calendar Service và quản lý đặt phòng.
