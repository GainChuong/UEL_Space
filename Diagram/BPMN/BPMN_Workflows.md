# Quy trình BPMN 2.0 - Campus Space Management System

Tài liệu này định nghĩa các quy trình nghiệp vụ chính của hệ thống theo quy chuẩn **BPMN 2.0 (Business Process Model and Notation)**.

---

## 1. Quy trình Đặt phòng & Phê duyệt (Booking & Approval Process)

> **Bao gồm:** F04 (Create Booking), F19-F20 (Approval Workflow), F35 (Conflict Detection), F14 (Notifications).

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (Sinh viên / Giảng viên)
    participant App as Web Frontend (Angular)
    participant Backend as Backend Server (NodeJS)
    participant DB as MongoDB Database
    actor Manager as Quản lý Không gian (Space Manager)

    User->>App: 1. Nhập thông tin & Gửi yêu cầu đặt phòng (Create Booking Request)
    App->>Backend: 2. Gửi dữ liệu yêu cầu (POST /api/bookings)
    Backend->>Backend: 3. Validation dữ liệu (Capacity, User role, Duration limit)
    alt Thông tin không hợp lệ
        Backend-->>App: Báo lỗi Validation
        App-->>User: Hiển thị lỗi form
    else Hợp lệ
        Backend->>DB: 4. Kiểm tra trùng lịch (F35 Conflict Detection)
        alt Bị trùng lịch phòng hoặc sự kiện
            DB-->>Backend: Phát hiện xung đột lịch
            Backend-->>App: Trả về lỗi phòng đã có lịch giữ
            App-->>User: Gợi ý chọn khung giờ/phòng khác
        else Lịch khả dụng
            Backend->>DB: 5. Lưu Booking Request (Trạng thái: PENDING)
            Backend->>DB: 6. Gửi thông báo đến Manager (Notification Engine)
            Manager->>App: 7. Xem danh sách yêu cầu cần duyệt (Manager Dashboard)
            alt Từ chối (Rejected)
                Manager->>App: Nhập lý do từ chối & Nhấp "Từ chối"
                App->>Backend: POST /api/approvals (Result: REJECTED)
                Backend->>DB: Cập nhật Booking (Status: REJECTED)
                Backend-->>User: Gửi email / Notification lý do từ chối
            else Phê duyệt (Approved)
                Manager->>App: Nhấp "Phê duyệt" (Approved)
                App->>Backend: POST /api/approvals (Result: APPROVED)
                Backend->>DB: Cập nhật Booking (Status: APPROVED)
                Backend->>DB: Đánh dấu Space Status (RESERVED)
                Backend-->>User: Gửi mã QR Check-in & Thông báo duyệt thành công
            end
        end
    end
```

---

## 2. Quy trình Check-in, Giám sát Hiện diện & Check-out (Check-in, Presence & Check-out Process)

> **Bao gồm:** F07 (Check-in QR), F08 (Check-out), F09 (Presence Tracking), F10 (Away Warning), F37 (Away Monitoring), F38 (Auto Checkout), F39 (Release Case Creation).

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant System as Web App / Mobile QR Reader
    participant Service as Usage Session Service
    participant DB as Database
    actor Staff as Nhân viên kiểm tra (Space Staff)

    %% Giai đoạn 1: Check-in
    User->>System: 1. Quét mã QR tại không gian (Scan QR Code)
    System->>Service: 2. Gọi API Check-in (F07)
    Service->>DB: Kiểm tra mã Booking & Check-in Window (Ví dụ: trước 10p - sau 30p)
    alt Không hợp lệ / Quá giờ
        Service-->>System: Báo lỗi Check-in thất bại
        System-->>User: Hiển thị thông báo không thể Check-in
    else Check-in hợp lệ
        Service->>DB: Tạo Usage Session (Status: ACTIVE)
        Service->>DB: Cập nhật Space Status (Status: OCCUPIED)
        Service-->>User: Hiển thị giao diện Session đang hoạt động
    end

    %% Giai đoạn 2: Giám sát vắng mặt tự động (Cron Job)
    loop Tiến trình kiểm tra hiện diện ngầm (F37 Away Monitoring)
        Service->>DB: Quét các Session đang ACTIVE
        opt Vắng mặt >= away_warning_minutes (F10)
            Service-->>User: Gửi cảnh báo "Bạn đã rời phòng quá lâu"
        end
        opt Vắng mặt >= auto_checkout_minutes (F38)
            Service->>DB: Cập nhật Session -> AUTO_CHECKED_OUT
            Service->>DB: Chuyển Space Status -> AVAILABLE
            Service->>DB: Tạo Hồ sơ Giải phóng phòng (Release Case - F39)
            Service->>Staff: Thông báo Nhân viên kiểm tra đồ đạc bỏ lại
            Staff->>DB: Cập nhật kết quả xác minh Release Case (F22)
        end
    end

    %% Giai đoạn 3: Check-out chủ động
    opt Người dùng chủ động Check-out (F08)
        User->>System: Bấm "Check-out" / Quét QR kết thúc
        Service->>DB: Chuyển Session Status -> COMPLETED
        Service->>DB: Giải phóng phòng -> AVAILABLE
        Service-->>User: Cảm ơn & Gợi ý gửi Đánh giá (Space Feedback)
    end
```

---

## 3. Quy trình Tự động Xử lý No-show (Automated No-show Process)

> **Bao gồm:** F36 (No-show Detection), F40 (Status Synchronization), BR24-BR25 (No-show Policy & Restriction).

```mermaid
sequenceDiagram
    autonumber
    participant Job as Background Cron Job (F36)
    participant DB as Database
    participant Notif as Notification Engine
    actor User as Người dùng

    loop Chạy định kỳ mỗi 5 phút
        Job->>DB: Quét các Booking Request có Status = APPROVED
        loop Với từng Booking quá hạn Check-in (Booking Start Time + Check-in Window)
            Job->>DB: Kiểm tra xem đã có Usage Session tương ứng chưa
            alt Chưa Check-in
                Job->>DB: Cập nhật Booking Request -> NO_SHOW
                Job->>DB: Giải phóng phòng -> AVAILABLE (F40 Sync)
                Job->>DB: Ghi nhận 1 lượt No-show vào hồ sơ User (BR24)
                Job->>Notif: Kích hoạt thông báo vi phạm No-show
                Notif-->>User: Gửi Email / Notification cảnh báo No-show
                
                opt Tỷ lệ No-show của User vượt ngưỡng quy định (BR25)
                    Job->>DB: Khóa quyền đặt phòng của User (Restrict Booking Permission)
                    Notif-->>User: Gửi thông báo tạm khóa tài khoản đặt phòng
                end
            end
        end
    end
```

---

## 4. Quy trình Báo cáo Sự cố & Bảo trì (Incident Reporting & Maintenance Process)

> **Bao gồm:** F12 (Incident Report), F23 (Incident Processing), F15 (Space Locking).

```mermaid
sequenceDiagram
    autonumber
    actor Reporter as Người báo cáo (Sinh viên/Giảng viên/Staff)
    participant App as Web Application
    participant Backend as Backend Server
    participant DB as Database
    actor Manager as Quản lý Kỹ thuật / Space Manager

    Reporter->>App: 1. Chọn Phòng/Thiết bị & Gửi báo cáo sự cố (F12)
    App->>Backend: 2. POST /api/incidents
    Backend->>DB: 3. Lưu Incident (Status: REPORTED)
    Backend->>Manager: 4. Gửi cảnh báo sự cố đến Quản lý
    Manager->>App: 5. Tiếp nhận & Kiểm tra chi tiết sự cố

    alt Sự cố nghiêm trọng (Cần đóng phòng để sửa)
        Manager->>App: Tạm khóa phòng (Lock Space / Maintenance - F15)
        App->>Backend: PUT /api/spaces/status (Status: MAINTENANCE)
        Backend->>DB: Khóa lịch đặt đối với phòng này
        Backend->>DB: Hủy hoặc dời các Booking sắp tới bị ảnh hưởng
        Manager->>App: Sửa chữa hoàn tất & Xác nhận mở lại phòng
        App->>Backend: PUT /api/spaces/status (Status: AVAILABLE)
    else Sự cố nhẹ (Sửa chữa thiết bị cá thể)
        Manager->>App: Sửa chữa / Thay thế thiết bị
    end

    Manager->>App: 6. Đánh dấu sự cố đã xử lý xong (Status: RESOLVED)
    App->>Backend: PUT /api/incidents/resolve
    Backend->>DB: Cập nhật thời gian hoàn tất (Completed_Time)
    Backend-->>Reporter: Gửi thông báo sự cố bạn báo cáo đã được khắc phục
```
