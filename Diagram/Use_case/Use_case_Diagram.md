# Sơ đồ Use Case - Campus Space Management System

Tài liệu này định nghĩa đầy đủ danh sách các **Actor**, **Use Case** và **Sơ đồ Use Case (Use Case Diagram)** tuân thủ tiêu chuẩn UML 2.0, trích xuất từ 4 tài liệu spec kỹ thuật [Business_Rules.md](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/Instruction/Business_Rules.md), [Function_Instructions.md](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/Instruction/Function_Instructions.md), [Entity_Specification.md](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/Instruction/Entity_Specification.md) và [Web_Development_OOP_Fullstack_Guide.md](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/Instruction/Web_Development_OOP_Fullstack_Guide.md).

---

## 1. Danh sách Actors & Hệ thống

1. **User (Sinh viên / Giảng viên):** Người sử dụng cơ bản, thực hiện tra cứu bản đồ, tìm kiếm phòng, tạo yêu cầu đặt phòng, check-in/check-out, báo cáo sự cố và đánh giá.
2. **Space Manager (Quản lý Không gian - QTTTS / Đơn vị trường):** Quản lý cơ sở vật chất, xét duyệt đặt phòng, thiết lập policy, xử lý sự cố và giải phóng phòng.
3. **System Admin (Quản trị hệ thống):** Quản lý tài khoản, phân quyền, cấu hình hệ thống và xem audit log.
4. **Automated System Jobs (Tiến trình tự động ngầm):** Chạy cron job xử lý xung đột lịch, no-show, cảnh báo vắng mặt, tự động check-out và gửi thông báo.

---

## 2. Sơ đồ Use Case Tổng thể (System Use Case Overview)

```mermaid
graph LR
    %% Actors
    subgraph Actors ["Tác nhân (Actors)"]
        U["👤 User<br/>(Sinh viên / Giảng viên)"]
        M["👨‍💼 Space Manager<br/>(Quản lý Không gian)"]
        A["🛠️ System Admin<br/>(Quản trị viên)"]
        J["⚙️ Background Job<br/>(Hệ thống tự động)"]
    end

    %% System Boundary
    subgraph System ["🏫 Campus Space Management System"]
        
        %% Module 1: Tra cứu & Tìm kiếm
        subgraph Mod1 ["1. Tra cứu & Không gian"]
            UC01(["F01: Xem bản đồ Campus Map"])
            UC02(["F02: Tìm kiếm phòng theo điều kiện"])
            UC03(["F03: Xem chi tiết phòng & Lịch sử dụng"])
        end

        %% Module 2: Đặt phòng
        subgraph Mod2 ["2. Đặt phòng & Phê duyệt"]
            UC04(["F04: Tạo yêu cầu đặt phòng"])
            UC05(["F05: Theo dõi trạng thái đặt phòng"])
            UC06(["F06: Hủy yêu cầu đặt phòng"])
            UC19(["F19-F20: Phê duyệt / Từ chối đặt phòng"])
        end

        %% Module 3: Sử dụng & Check-in
        subgraph Mod3 ["3. Sử dụng & Giám sát hiện diện"]
            UC07(["F07: Check-in bằng mã QR"])
            UC08(["F08: Check-out phiên sử dụng"])
            UC09(["F09: Xác nhận hiện diện (Presence)"])
            UC11(["F11: Xem lịch sử sử dụng cá nhân"])
        end

        %% Module 4: Báo cáo & Phản hồi
        subgraph Mod4 ["4. Sự cố & Phản hồi"]
            UC12(["F12: Báo cáo sự cố thiết bị/phòng"])
            UC13(["F13: Gửi đánh giá phản hồi phòng"])
            UC23(["F23: Xử lý sự cố & Giải phóng phòng"])
        end

        %% Module 5: Quản trị Không gian
        subgraph Mod5 ["5. Quản trị Không gian & Policy"]
            UC15(["F15-F18: Tạo / Cập nhật / Khóa phòng"])
            UC17(["F17: Quản lý lịch thời khóa biểu"])
            UC18(["F18: Cấu hình chính sách Space Policy"])
            UC24(["F24-F28: Xem báo cáo & Tỉ lệ lấp đầy"])
        end

        %% Module 6: Quản trị Hệ thống
        subgraph Mod6 ["6. Quản trị Hệ thống"]
            UC29(["F29: Quản lý người dùng"])
            UC30(["F30: Phân quyền & Quản lý Vai trò"])
            UC31(["F31: Quản lý Tổ chức & Thành viên"])
            UC34(["F34: Xem Nhật ký Hệ thống Audit Log"])
        end

        %% Module 7: Tiến trình ngầm
        subgraph Mod7 ["7. Tự động hóa Ngầm"]
            UC35(["F35: Phát hiện xung đột lịch"])
            UC36(["F36: Xử lý No-show tự động"])
            UC37(["F37: Cảnh báo vắng mặt (Away Warning)"])
            UC38(["F38: Auto Check-out & Tạo Release Case"])
        end

    end

    %% Relationships - User
    U --> UC01
    U --> UC02
    U --> UC03
    U --> UC04
    U --> UC05
    U --> UC06
    U --> UC07
    U --> UC08
    U --> UC09
    U --> UC11
    U --> UC12
    U --> UC13

    %% Relationships - Manager
    M --> UC19
    M --> UC15
    M --> UC17
    M --> UC18
    M --> UC23
    M --> UC24

    %% Relationships - Admin
    A --> UC29
    A --> UC30
    A --> UC31
    A --> UC34

    %% Relationships - Background Job
    J --> UC35
    J --> UC36
    J --> UC37
    J --> UC38

    %% Include / Extend relationships
    UC04 .->|"<<include>>"| UC35
    UC04 .->|"<<include>>"| UC02
    UC07 .->|"<<include>>"| UC05
    UC13 .->|"<<extend>>"| UC08
    UC38 .->|"<<include>>"| UC23
```

---

## 3. Chi tiết Quan hệ Include & Extend theo chuẩn UML 2.0

### 3.1 Quan hệ Phụ thuộc Bắt buộc (`<<include>>`)
1. **`F04: Tạo yêu cầu đặt phòng` INCLUDE `F35: Phát hiện xung đột lịch`**
   - *Mô tả:* Khi người dùng nhấn gửi yêu cầu đặt phòng, hệ thống bắt buộc phải kích hoạt kiểm tra trùng lịch trước khi tạo yêu cầu.
2. **`F07: Check-in bằng mã QR` INCLUDE `F05: Theo dõi trạng thái đặt phòng`**
   - *Mô tả:* Để thực hiện Check-in, hệ thống bắt buộc phải kiểm tra thông tin của mã Đặt phòng đã duyệt sẵn có.
3. **`F38: Auto Check-out` INCLUDE `F22: Tạo hồ sơ giải phóng phòng (Release Case)`**
   - *Mô tả:* Khi hệ thống tự động Check-out do người dùng vắng mặt quá thời hạn, nó luôn tự động sinh ra một `Release Case` để nhân viên quản lý phòng kiểm tra đồ đạc còn sót lại.

---

### 3.2 Quan hệ Mở rộng Điều kiện (`<<extend>>`)
1. **`F13: Gửi đánh giá phản hồi` EXTEND `F08: Check-out phiên sử dụng`**
   - *Điều kiện:* Mở rộng sau khi người dùng vừa hoàn tất Check-out một phiên sử dụng phòng (ACTIVE ➔ COMPLETED).
2. **`F15: Tạm khóa phòng (Maintenance)` EXTEND `F23: Xử lý sự cố (Incident)`**
   - *Điều kiện:* Mở rộng khi Quản lý đánh giá sự cố báo cáo ở mức độ nghiêm trọng cần phong tỏa phòng để bảo trì.
3. **`BR25: Khóa quyền đặt phòng` EXTEND `F36: Xử lý No-show tự động`**
   - *Điều kiện:* Mở rộng khi tổng tỷ lệ `No-show` trong lịch sử người dùng vượt ngưỡng cấu hình của chính sách.
